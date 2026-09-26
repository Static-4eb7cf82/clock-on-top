# Clock On Top

A lightweight, draggable clock that stays on top of all your windows.

<img src="assets/34XVqg6ZqY.jpg" width="850" />

## Features

- **Always On Top**: The clock stays visible above all other windows, including windowed-fullscreen applications like video games
- **No Window Title Bar or Border**: Seamlessly integrates with your desktop
- **Draggable**: Click and drag to position the clock anywhere on your screen
- **Clean Design**: Simple, readable 12-hour time format
- **Customizable**: Change the appearance of the clock, including font, color, background, and size
- **Lightweight**: Built with Tauri for minimal resource usage

## Installation

Download the latest installer from the [Releases](../../releases) page and run it.

## Usage

1. Launch the application
2. The clock will appear on your screen
3. Click and drag to reposition it
4. Right-click the system tray icon to access options or quit

## Development

The project uses mise to provide the Node.js and Rust toolchains. From the repository root, run `mise install` to install them. Frontend and Rust checks do not require signing credentials.

### Local production builds

Production builds create signed Tauri updater artifacts and require the updater private key. This key must match the public key configured in `app/src-tauri/tauri.conf.json`; ask a project maintainer for access to the existing key rather than generating a new one. Never commit or share the private key.

1. Store the key file outside this repository, for example at `~/.tauri/clock-on-top.key`. The key can also be provided as its contents, but keeping it in a separate file avoids putting the secret in configuration.
2. Create `mise.local.toml` in the repository root with the path to your key:

    ```toml
    [env]
    TAURI_SIGNING_PRIVATE_KEY = { value = '~/.tauri/clock-on-top.key', redact = true }
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD = { value = '<key-password>', redact = true }
    ```

    Replace the example path with the actual path on your machine. `mise.local.toml` is gitignored. The `redact` option masks values in mise task output; it does not encrypt them.
3. Run the `build: production` VS Code task, or from `app` run `mise exec -- npm run tauri build`.

The GitHub Actions release build uses repository secrets for these same variables. The updater signing key is separate from Windows Authenticode code signing.