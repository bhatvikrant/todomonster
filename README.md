# TodoMonster

## 🚀 How to run this app locally

Install the application dependencies:

```bash
bun install
```

### 🔌 Start Your Soketi Server

Install the Soketi command line:

```bash
bun install -g @soketi/soketi
```

Then, run the local Soketi server:

```bash
soketi start
```

### 🔑 Generate your Replicache License Key

Run the command:

```bash
bun dlx replicache@latest get-license
```

Then, add your key to your `.env.local` file.

```bash
REPLICACHE_LICENSE_KEY=your-license-key-here
```

### 📘 Initialize your database

Run the Drizzle push command:

```bash
bun push
```

### 🚀 Run the application

Run the command:

```bash
bun dev
```

Ensure that the host and port is of the same in the Soketi server as the NextJS application.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔌 Why Soketi

I'm using [Soketi](https://soketi.app/) for our web socket service to send and receive pokes. When we push data, send a poke to notify all other applications to pull for the updated data.

# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.
