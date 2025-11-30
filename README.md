# 🎙️ Transcription AI Project

Une application complète de transcription vocale utilisant **AWS Transcribe**, **React**, **Node.js/Express** et **MongoDB**.

## 📋 Vue d'ensemble

Ce projet permet aux utilisateurs d'enregistrer ou de télécharger des fichiers audio pour obtenir une transcription textuelle précise grâce à l'intelligence artificielle d'Amazon Web Services (AWS).

### Architecture

*   **Frontend** : React (Vite) pour l'interface utilisateur.
*   **Backend** : Node.js + Express (API REST).
*   **Base de données** : MongoDB pour stocker les métadonnées des transcriptions.
*   **Services AWS** :
    *   **S3** : Stockage sécurisé des fichiers audio.
    *   **Transcribe** : Service de conversion Speech-to-Text.
    *   **EC2** : (Optionnel) Pour l'hébergement de l'application.
    *   **CloudWatch** : Monitoring des logs et performances.

---

## 🚀 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

*   [Node.js](https://nodejs.org/) (v16 ou supérieur)
*   [MongoDB](https://www.mongodb.com/try/download/community) (local ou Atlas)
*   Un compte **AWS** actif avec des clés d'accès (Access Key ID & Secret Access Key).

---

## 🛠️ Installation et Configuration

### 1. Cloner le projet

```bash
git clone <votre-repo-url>
cd transcription-ai-project
```

### 2. Configuration du Backend

Allez dans le dossier `backend` et installez les dépendances :

```bash
cd backend
npm install
```

Créez un fichier `.env` à la racine du dossier `backend` avec les informations suivantes :

```env
# Serveur
PORT=5000
NODE_ENV=development

# Base de données
MONGODB_URI=mongodb://localhost:27017/transcription-db

# AWS Configuration
AWS_REGION=eu-west-1              # Votre région AWS (ex: eu-west-1 pour Paris/Irlande)
AWS_ACCESS_KEY_ID=VOTRE_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=VOTRE_SECRET_KEY
S3_BUCKET=nom-de-votre-bucket-unique
```

> **Note** : Assurez-vous que votre utilisateur IAM AWS a les droits `AmazonS3FullAccess` et `AmazonTranscribeFullAccess`.

### 3. Configuration du Frontend

Allez dans le dossier `linguistai-frontend` et installez les dépendances :

```bash
cd ../linguistai-frontend
npm install
```

---

## ▶️ Démarrage de l'application

### Démarrer le Backend

Dans le dossier `backend` :

```bash
npm run dev
```
Le serveur démarrera sur `http://localhost:5000`.

### Démarrer le Frontend

Dans le dossier `linguistai-frontend` :

```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

---

## 🧪 Utilisation et Test

### Test de la Transcription (AWS Transcribe)

Vous pouvez tester la fonctionnalité de transcription directement via l'interface utilisateur ou en utilisant les scripts fournis dans le backend.

#### Via le script de test (Backend)

Un script `test_transcription.sh` est disponible pour vérifier rapidement votre configuration AWS.

```bash
cd backend
chmod +x test_transcription.sh
./test_transcription.sh /chemin/vers/votre/fichier_audio.mp3
```

Ce script va :
1. Uploader le fichier sur S3.
2. Lancer un job de transcription AWS.
3. Attendre et afficher le résultat de la transcription.

#### Via l'Application (Frontend)

1. Ouvrez l'application dans votre navigateur.
2. Utilisez le composant d'upload ou d'enregistrement vocal.
3. Le fichier sera envoyé au backend, puis à AWS S3.
4. Une fois la transcription terminée par AWS, le texte s'affichera à l'écran.

---

## 📂 Structure du Projet

```
transcription-ai-project/
├── backend/                 # Serveur Node.js/Express
│   ├── src/
│   │   ├── controllers/     # Logique métier
│   │   ├── models/          # Modèles Mongoose
│   │   ├── routes/          # Définitions des routes API
│   │   ├── services/        # Services AWS (S3, Transcribe)
│   │   └── server.js        # Point d'entrée
│   └── ...
├── linguistai-frontend/     # Application React
│   ├── src/
│   │   ├── components/      # Composants UI
│   │   ├── hooks/           # Hooks personnalisés (ex: useGeminiLive)
│   │   └── ...
│   └── ...
└── README.md                # Documentation du projet
```

## 🛡️ Sécurité

*   Ne jamais commiter le fichier `.env`.
*   Utilisez des variables d'environnement pour toutes les clés secrètes.
*   Configurez les règles CORS pour n'autoriser que votre domaine frontend en production.

## 📄 Licence

Ce projet est sous licence MIT.
