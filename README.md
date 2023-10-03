# Project description

Demo project for turning multimedia (audio) to structured notes.

Created using a template from https://github.com/RobertBarachini/nodejs-template

# Setup

## Node.js

Install Node.js and pnpm (recommended) or npm (not recommended).

```sh
# Install dependencies
pnpm install
```

## OpenAI

Add the OpenAI API key (as exported variable) to `.env` file in the root of the project. Example:

```sh
export OPENAI_API_KEY="sk-..."
```

## ffmpeg

```sh
sudo apt update && sudo apt install ffmpeg -y
```

## Whisper

```sh
# Install Whisper
pip install git+https://github.com/openai/whisper.git
# The first time you run the command 'whisper' in CLI it will download the model, however you can download it manually as well to speed up the process
# Download the medium model - I'm using aria2c but you can use wget or curl as well
# Alternative url: https://openaipublic.azureedge.net/main/whisper/models/345ae4da62f9b3d59415adc60127b97c714f32e89e936602e85993674d08dcb1/medium.pt
# NOTE: The default CDN is VERY slow (around 16 KiB/s), the below link should be much faster (around 12 MiB/s)
mkdir -p ~/.cache/whisper
aria2c -d ~/.cache/whisper https://openaipublic.blob.core.windows.net/main/whisper/models/345ae4da62f9b3d59415adc60127b97c714f32e89e936602e85993674d08dcb1/medium.pt
# Example usage - default model is small; if no language is specified, it will try to detect it
whisper recording.wav
# Example usage - get just the results, it will also create files with results in the current directory (.txt, .srt, ...)
whisper recording.wav --language English --model medium 2>/dev/null | grep '^\['
```

# Run

## Native

Start the server using the following command:

```sh
pnpm run dev
```

Open `index.html` using your browser or if you're using VS Code, you can use the `Live Preview` extension (by Microsoft).
You can start the Live Preview server by opening the command palette and typing `Live Preview: Show Preview (External Browser)`. To stop the server, open the command palette and type `Live Preview: Stop Preview`.

# Guidelines

## Code style

Code uses `ES6` syntax (`"type": "module"` in package.json). It is recommended to use `const` and `let`. Use arrow functions. Function declarations using the `function` keyword is discouraged (hoisting can cause issues and decreases readability).

It is also suggested you use good coding practices, such as early returns, avoiding nested if statements, etc.

## Commit messages

Commit messages should be short and descriptive. They should be written in the imperative mood. Example:

```sh
git commit -m "Add new feature"
```

Commit messages should be written in English. Try to avoid implementing multiple changes / functionalities if not necessary (could be needed for certain situations, such as major changes and refactoring).

## import / export

Imports should occur at the top of the file.

Exports should occur at the bottom of the file in the following pattern:

```js
export { foo, bar, baz }
```

or

```js
export default foo
```

NOTE: Linting doen't play nicely with imports (still broken for some reason). Node.js path aliases are not recognized as valid imports either. This is a known issue and will be fixed in the future.

# Development

It is recommended that you use VS Code as your editor as it provides a seamless development experience (even on remotes) without the need for any additional programs. It has built-in support for ESLint and Prettier. It also has a built-in debugger. If you are developing natively, and have enabled 'smart' auto-attach, the debugged is automatically attached to the running process. If you are using Docker, you can use a launch configuration `Attach to Docker port` to attach to the running process (it is exposed on port 9229).

Development environment uses Nodemon, which enables hot reloading (supported in native and Docker dev environments).

## Native

If you wish to run the project natively, you will need to install Node.js and npm. It is also suggested that you use pnpm instead of npm (it has many advantages). You can install it using `npm install -g pnpm` or natively (check their website).

### Install dependencies

```sh
pnpm install
```

### Run

```sh
pnpm run dev
```

## Using Docker

Run the app using Docker Compose. It is recommended to use Docker Compose for development as it provides a consistent environment.

### Run

```sh
pnpm run compose:up
```

After stopping the server for a longer period of time, it is recommended to run `pnpm run compose:down` to remove the containers and other attached resources.

# Production

## Native

### Install dependencies

```sh
pnpm install --frozen-lockfile --production
```

### Run

```sh
NODE_ENV="production" node src/server/index.js
# Or alternatively
pnpm run start
```

## Using Docker

Build happens when running the Docker Compose command. It is recommended to use Docker Compose for production as it provides a consistent environment.

### Run

```sh
docker compose -f 'docker-compose.yml' up --build --force-recreate --remove-orphans
```

After you are done it is recommended to run `docker compose -f 'docker-compose.yml' down --remove-orphans --volumes --rmi all` to remove the containers and other attached resources.

# Testing

## Unit tests

Testing is done using the Mocha framework. It is recommended you put unit tests in the same folder as the file you are testing. For example, if you are testing `src/server/index.js`, you should put the test in `src/server/index.test.js`.

## Integration tests

TODO

## Contract-based tests

TODO

## API testing (Thunder Client)

Project has a defined local (scope: workspace) Thunder Client (VS Code extension) setup. The relevant files are located in `tests/thunder-tests`, however you should only edit them if you really understand them. This extension makes it easy to test your API without having to install any additional software (like Postman).

# Project structure

- `src/` - source code
- `src/scripts/` - scripts (build, ...)
- `src/server/` - server code
- `src/utils/` - utilities
  - It is recommended to use ustils (especially makeRequest) as it provides a unified way of handling errors and responses. Suggested import: `import { makeRequest } from '#utils/requests.js'`. Project uses path aliases, so you can use `#utils/requests.js` instead of `../../utils/requests.js`. Try to avoid using child paths (`../..`) as it makes it harder to move files around.
- `logs/` - logs (mapped using volumes if using Docker)

# Keywords:

- nodejs
- template
- express
- ES6
- docker
- eslint
- prettier
- development
- production
- testing
- debug
- mocha

# TODO

- [x] Write a README.md
- [x] Create backend
- [ ] Create frontend
- [ ] Improve prompts
