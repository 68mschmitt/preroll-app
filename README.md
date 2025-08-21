# Preroll App

## Description

The Preroll App is designed to streamline media content management by organizing and enabling preroll videos and audio files. It offers features to enable and disable preroll media efficiently while integrating seamlessly with Plex servers. This tool is ideal for enhancing the user experience by automating preroll media playback.

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/preroll-app.git
   ```
2. Navigate to the project directory:
   ```bash
   cd preroll-app/server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure the environment variables by copying the `.local.env` template and updating it with your details:
   ```bash
   cp .local.env .env
   ```
5. Start the server:
   ```bash
   npm start
   ```

## Usage

### Enabling Preroll Media
1. Place your preroll media files in the `enabled` directory specified in your `.env` file.

2. The server will automatically detect and use these files for preroll playback.

### Disabling Preroll Media
1. Move the files you want to disable to the `disabled` directory specified in your `.env` file.

2. These files will no longer be used by the server.

### Monitoring Server Logs
To view server activity and troubleshoot issues:
```bash
npm run logs
```

## Contribution

### Submitting Issues
If you encounter any issues or have feature requests, please submit them via the [GitHub Issues](https://github.com/your-repo/preroll-app/issues) page.

### Making Changes
1. Fork the repository and create your feature branch:
   ```bash
   git checkout -b feature/YourFeatureName
   ```

2. Commit your changes:
   ```bash
   git commit -m 'Add YourFeatureName'
   ```

3. Push the branch to your fork:
   ```bash
   git push origin feature/YourFeatureName
   ```

4. Open a pull request against the `main` branch of this repository.

### Code of Conduct
Please adhere to the [Code of Conduct](https://github.com/your-repo/preroll-app/CODE_OF_CONDUCT.md) when interacting in this project.

## TODO

- Add a scheduling feature to play specific preroll media at certain times.
- Develop a web dashboard for managing enabled and disabled media.
- Enable support for multiple Plex servers.
- Add analytics to track views and usage of preroll media.
- Integrate cloud storage options for hosting preroll media.
- Designate specific preroll media for different user profiles.
