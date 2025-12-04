# SkillShare_FHE

A decentralized, privacy-preserving peer-to-peer skill sharing platform. SkillShare_FHE allows community members to anonymously share and learn skills such as programming, cooking, or design. Users submit encrypted skill offerings and learning requests, while the platform uses homomorphic encryption (FHE) to match participants and process feedback without exposing personal preferences.

## Project Overview

Traditional skill-sharing platforms face challenges related to privacy, trust, and bias:

- **Privacy Risks**: Users may hesitate to share skills or requests due to identity exposure.
- **Data Misuse**: Centralized platforms could misuse or leak sensitive user information.
- **Limited Anonymity**: Peer evaluations and recommendations often reveal personal preferences.
- **Trust Issues**: Users cannot verify whether skill matches or ratings are handled fairly.

SkillShare_FHE solves these challenges by:

- Allowing all skill data and learning requests to be encrypted on the client side.
- Using FHE to perform matching and rating calculations in the encrypted domain.
- Ensuring user preferences and activity remain fully private.
- Maintaining transparent, verifiable aggregation of skill popularity and feedback.

## Features

### Core Functionality

- **Encrypted Skill Sharing**: Users submit their skills in encrypted form.
- **Anonymous Learning Requests**: Learners request guidance without revealing identities.
- **Encrypted Matching Engine**: Matches are computed in the encrypted domain via FHE.
- **Feedback System**: Learners provide ratings, also processed securely.
- **Skill Discovery Dashboard**: Browse available skills and aggregated ratings securely.

### Privacy & Security

- **Client-Side Encryption**: All skills and requests are encrypted before transmission.
- **Homomorphic Computation**: FHE enables computation on encrypted data without decryption.
- **Anonymous Ratings**: Feedback is collected without exposing identities.
- **Immutable Logs**: Skill submissions and ratings cannot be tampered with once recorded.
- **Encrypted Aggregation**: Popularity and matching metrics are calculated without revealing raw data.

## Architecture

### Smart Contracts

- **SkillShareFHE.sol**  
  - Handles encrypted skill submissions and learning requests.  
  - Tracks encrypted match results and aggregated skill feedback.  
  - Provides a public interface for encrypted statistics verification.  

### Frontend Application

- **Framework**: React 18 + TypeScript for dynamic, responsive UI.  
- **Encrypted Client**: Users encrypt skill data and requests locally before submission.  
- **Dashboard**: Displays skill availability, ratings, and aggregated statistics in real-time.  
- **Search & Filter**: Find skills or learners securely based on encrypted tags and preferences.  
- **Notifications**: Optional alerts for skill matches or request status updates.

## Technology Stack

### Blockchain

- **Solidity ^0.8.24**: Smart contract development.  
- **OpenZeppelin**: Security and contract utilities.  
- **Hardhat**: Development, testing, and deployment framework.  
- **Ethereum Sepolia Testnet**: Current deployment environment.

### Frontend

- **React 18 + TypeScript**: Modern frontend framework.  
- **Ethers.js**: Interaction with blockchain smart contracts.  
- **Tailwind + CSS**: Responsive and flexible UI styling.  
- **React Icons**: Interface iconography.  

### Encryption

- **FHE Library**: Full homomorphic encryption for encrypted matching and aggregation.  
- **End-to-End Encrypted Requests**: Users’ preferences and skill data are never exposed in plaintext.  

## Installation

### Prerequisites

- Node.js 18+  
- npm / yarn / pnpm  
- Ethereum wallet for interaction (optional)  

### Setup

1. Clone the repository.  
2. Install dependencies: `npm install` or `yarn install`.  
3. Connect to the Sepolia Testnet.  
4. Compile and deploy smart contracts using Hardhat.  
5. Run the frontend with `npm start` or `yarn start`.

## Usage

- **Submit Skills**: Encrypt and submit your skill set.  
- **Request Learning**: Submit encrypted learning requests.  
- **View Matches**: Check skill matches processed securely.  
- **Provide Feedback**: Submit encrypted ratings and comments.  
- **Dashboard Monitoring**: Monitor aggregated skill popularity and feedback in real-time.

## Security Features

- **End-to-End Encryption**: All data remains encrypted on client devices.  
- **Immutable Contract Storage**: Blockchain ensures data cannot be altered.  
- **Anonymous Operations**: Users do not reveal identities in skill sharing or learning requests.  
- **Encrypted Aggregation**: Matching and ratings computed without decrypting user data.

## Roadmap

- Full FHE integration for advanced skill matching algorithms.  
- Threshold-based recommendations for skill scarcity.  
- Multi-chain support for global community access.  
- Enhanced mobile-friendly UI and notifications.  
- Decentralized governance for community-driven platform evolution.

Built with ❤️ to empower lifelong learning while fully preserving user privacy.
