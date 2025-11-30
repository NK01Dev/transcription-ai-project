import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData, playSystemSound } from '../utils/audioUtils';
import { Language, Difficulty } from '../types';

interface UseGeminiLiveProps {
  language: Language;
  difficulty: Difficulty;
  onTranscriptUpdate: (text: string, isUser: boolean, isFinal: boolean) => void;
}

export const useGeminiLive = ({ language, difficulty, onTranscriptUpdate }: UseGeminiLiveProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [error, setError] = useState<string | null>(null);

  // Audio Context Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Playback Refs
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Session Refs
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const currentSessionRef = useRef<any>(null); // To hold the actual session object for cleanup if needed

  // Transcription Accumulators
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');

  // Track if we have already played the disconnect sound to avoid duplicates on cleanup
  const hasDisconnectedRef = useRef(false);

  const disconnect = useCallback(() => {
    // Prevent double cleanup
    if (hasDisconnectedRef.current) return;
    
    // Play sound only if we were previously connected
    if (currentSessionRef.current) {
        playSystemSound('disconnect');
    }
    hasDisconnectedRef.current = true;

    // Close audio contexts
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }

    // Stop tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop playback sources
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    audioSourcesRef.current.clear();

    // Close session
    if (currentSessionRef.current) {
       try {
        currentSessionRef.current.close(); 
       } catch (e) {
         console.warn("Error closing session:", e);
       }
       currentSessionRef.current = null;
    }

    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      hasDisconnectedRef.current = false;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Initialize Audio Contexts
      const InputContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const inputCtx = new InputContextClass({ sampleRate: 16000 });
      const outputCtx = new InputContextClass({ sampleRate: 24000 });
      
      // Resume contexts if they are suspended (crucial for some browsers)
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      // Get Microphone Stream - This will prompt for permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Construct dynamic system instruction based on difficulty
      let difficultyStrategy = "";
      switch (difficulty) {
        case Difficulty.BEGINNER:
          difficultyStrategy = `
            Target Level: A1-A2 (Beginner)
            Strategy:
            - Speak slowly, clearly, and use simple vocabulary.
            - Focus on concrete topics: self-introduction, family, home, daily routine, hobbies, likes/dislikes.
            - Avoid complex grammar like conditionals or passive voice.
            - If the user struggles, simplify your question or provide examples.
          `;
          break;
        case Difficulty.INTERMEDIATE:
          difficultyStrategy = `
            Target Level: B1-B2 (Intermediate)
            Strategy:
            - Speak at a natural, conversational pace.
            - Use a mix of simple and complex sentence structures.
            - Topics: travel experiences, work/school life, future plans, recounting past events, describing feelings.
            - Ask "Why" and "How" questions to elicit opinions and explanations.
          `;
          break;
        case Difficulty.ADVANCED:
          difficultyStrategy = `
            Target Level: C1-C2 (Advanced)
            Strategy:
            - Speak at a fast, native-like pace.
            - Use sophisticated vocabulary, idioms, and colloquialisms.
            - Topics: abstract concepts, societal issues, technology ethics, politics, philosophy, hypothetical situations.
            - Challenge the user's views and ask for detailed argumentation and nuance.
          `;
          break;
      }

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are a professional language examiner for ${language}. 
          Your goal is to assess the user's proficiency level through a structured interview.
          
          ${difficultyStrategy}
          
          General Guidelines:
          1. Ask one question at a time. Do not overwhelm the user.
          2. Keep your responses concise (1-2 sentences max) to maximize the user's speaking time.
          3. Be encouraging but neutral. Do not explicitly correct their mistakes during the interview, just note them mentally for the final score.
          4. If the user asks for clarification, provide it gently at their level.
          
          Start by welcoming the user and asking the first question appropriate for the ${difficulty} level.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      };

      const sessionPromise = ai.live.connect({
        model: config.model,
        config: config.config,
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            setIsConnected(true);
            playSystemSound('connect');

            // Setup Input Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData, 16000);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            
            sourceRef.current = source;
            processorRef.current = scriptProcessor;
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentOutputTransRef.current += text;
              onTranscriptUpdate(currentOutputTransRef.current, false, false);
            } else if (message.serverContent?.inputTranscription) {
               const text = message.serverContent.inputTranscription.text;
               currentInputTransRef.current += text;
               onTranscriptUpdate(currentInputTransRef.current, true, false);
            }

            if (message.serverContent?.turnComplete) {
              // Commit the transaction to history in UI
              if (currentInputTransRef.current) {
                  onTranscriptUpdate(currentInputTransRef.current, true, true);
                  currentInputTransRef.current = '';
              }
              if (currentOutputTransRef.current) {
                  onTranscriptUpdate(currentOutputTransRef.current, false, true);
                  currentOutputTransRef.current = '';
              }
            }

            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              // Trigger "Speaking" sound if not already speaking
              setIsSpeaking((prev) => {
                if (!prev) playSystemSound('ai-turn');
                return true;
              });

              const ctx = outputContextRef.current;
              if (!ctx) return;

              // Ensure clean timing
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                  setIsSpeaking(false);
                  playSystemSound('user-turn');
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              console.log("Interrupted");
              audioSourcesRef.current.forEach(s => s.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
              // Clear pending output transcript
              currentOutputTransRef.current = ''; 
            }
          },
          onclose: () => {
            console.log("Session closed");
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error("Session error", err);
            setError("Connection error. Please try again.");
            disconnect();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
      sessionPromise.then(s => {
          currentSessionRef.current = s;
      });

    } catch (err: any) {
      console.error(err);
      let errorMessage = "Failed to initialize audio or AI session.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Permission denied. Please allow microphone access.";
      }
      setError(errorMessage);
      disconnect();
    }
  }, [language, difficulty, disconnect, onTranscriptUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect, isConnected, isSpeaking, error };
};