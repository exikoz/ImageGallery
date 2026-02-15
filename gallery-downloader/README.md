## Prerequisites

- Node.js installed.

- Unsplash API Access Key (Get one for free at [Unsplash Developers](https://unsplash.com/developers)).

  

## Setup & Image Generation

1.  **Install dependencies:**

```bash
npm install axios sharp
```

Configure API Key:

Open setup-assets.js and paste your key in the ACCESS_KEY variable.

  

Run the automation script:

```bash
node setup-assets.js
```
  

This will download 40 images, optimize them to WebP, create thumbnails, and generate data/images.json.
