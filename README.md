# Medical Chatbot Project

This project is a medical chatbot application designed to assist users/patients by providing general advice, recording symptoms, generating medical reports, and notifying doctors based on the severity of symptoms.

## Project Structure

```
medical-chatbot
├── server
│   ├── config
│   │   └── db.js
│   ├── models
│   │   ├── User.js
│   │   ├── Report.js
│   │   └── Alert.js
│   ├── services
│   │   ├── chatService.js
│   │   ├── reportService.js
│   │   └── alertService.js
│   ├── routes
│   │   ├── auth.js
│   │   ├── chat.js
│   │   └── reports.js
│   └── server.js
├── client
│   ├── src
│   │   ├── components
│   │   │   ├── Chat.js
│   │   │   └── Reports.js
│   │   ├── services
│   │   │   └── api.js
│   │   └── App.js
│   └── package.json
├── package.json
└── README.md
```

## Features

- **User Authentication**: Users can register and log in to access the chatbot.
- **Chat Interaction**: The chatbot provides general advice and suggestions based on user inputs.
- **Symptom Recording**: Users can record their symptoms during chat interactions.
- **Medical Report Generation**: The application generates medical reports based on chat history and user inputs.
- **Alerts for Doctors**: The system generates alerts based on the severity of symptoms and notifies doctors accordingly.

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd medical-chatbot
   ```

2. **Install server dependencies**:
   ```
   cd server
   npm install
   ```

3. **Install client dependencies**:
   ```
   cd client
   npm install
   ```

4. **Set up the database**:
   - Ensure you have MongoDB installed and running.
   - Update the database connection settings in `server/config/db.js`.

5. **Run the server**:
   ```
   cd server
   npm start
   ```

6. **Run the client**:
   ```
   cd client
   npm start
   ```

## Usage

- Access the chatbot through the client interface.
- Interact with the chatbot to receive advice and record symptoms.
- View and manage medical reports generated from chat interactions.

## License

This project is licensed under the MIT License.