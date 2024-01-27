# TodoMonster

## 🚀 How to run this app locally

Install the application dependencies:

```bash
bun install
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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.
