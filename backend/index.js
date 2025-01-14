const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const express = require('express');

const app = express();
const PORT = 3000;

function generateHeatmapPattern(name, startDate, repoDir) {
    const patterns = {
      A: "xxxxxxxxooxoooxooxoooxxxxxxxooooooo",
      S: "xxxxoxxxooxooxxooxooxxooxxxxooooooo",
      P: "xxxxxxxxooxoooxooxoooxxxxoooooooooo",
      I: "xoooooxxxxxxxxxxxxxxxxoooooxooooooo",
      R: "xxxxxxxxooxoooxooxxooxxxooxxooooooo",
      E: "xxxxxxxxooxooxxooxooxxooxooxooooooo",
      V: "xxxxxooooooxxoooooxxoxxxxxooooooooo",
    };
  
    const patternString = name
      .split('')
      .map((char) => patterns[char.toUpperCase()] || '')
      .join('');
    const patternLength = patternString.length;
  
    const currentDate = new Date(startDate);
    const commitFile = path.join(repoDir, 'newlol.txt');
  
    for (let i = 0; i < patternLength; i++) {
      const char = patternString[i];
      if (char === 'x') {
        const commitDate = currentDate.toISOString();
        for (let day = 0; day < 5; day++) {
          fs.appendFileSync(commitFile, `${commitDate} Day ${day}\n`);
  
          const command =
            process.platform === 'win32'
              ? `cd ${repoDir} && git add . && set GIT_AUTHOR_DATE="${commitDate}" && set GIT_COMMITTER_DATE="${commitDate}" && git commit -m "Day ${day}, Commit ${commitDate}"`
              : `cd ${repoDir} && git add . && GIT_AUTHOR_DATE="${commitDate}" GIT_COMMITTER_DATE="${commitDate}" git commit -m "Day ${day}, Commit ${commitDate}"`;
  
          execSync(command, { stdio: 'inherit' });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

function generateRepo(name, startDate = '2024-01-07') {
  const repoDir = "my-contributions-aspireve";

  try {
    // Check if the repository directory already exists and delete it
    if (fs.existsSync(repoDir)) {
      console.log(`Cleaning up existing repository: ${repoDir}`);
      try {
        fs.rmSync(repoDir, { recursive: true, force: true });
        console.log(`Successfully deleted: ${repoDir}`);
      } catch (err) {
        console.error(`Error deleting ${repoDir}: ${err.message}`);
        throw new Error(`Failed to clean up existing repository: ${repoDir}`);
      }
    }

    // Initialize repository
    console.log(`Initializing repository: ${repoDir}`);
    fs.mkdirSync(repoDir); // Create the repository directory
    process.chdir(repoDir); // Change the working directory to the new repo
    execSync(`git config --global user.email "steve1818fernandes@gmail.com"`);
    execSync(`git config --global user.name "Aspireve"`);
    execSync(`git init`);

    // Generate heatmap pattern commits
    console.log(`Generating heatmap pattern for: ${name}`);
    generateHeatmapPattern(name, startDate, repoDir);

    // Zip the repository
    process.chdir(".."); // Change back to the parent directory
    console.log(`Zipping the repository: ${repoDir}`);
    execSync(`zip -r ${repoDir}.zip ${repoDir}`);
    console.log(`Repository zipped as: ${repoDir}.zip`);

    return `${repoDir}.zip`;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}


// Middleware to parse JSON body
app.use(express.json());

// Route to generate a repository with a heatmap
app.post('/generate-repo', (req, res) => {
  const { name, startDate } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid input. "name" must be a string.' });
  }

  console.log(`Received request to generate repo with name: ${name}`);
  const zipFilePath = generateRepo(name, startDate || '2024-01-07');

  if (zipFilePath) {
    res.download(zipFilePath, `${name}-repo.zip`, (err) => {
      if (err) {
        console.error(`Error sending file: ${err.message}`);
      }
      // Clean up zip file after sending
      fs.unlinkSync(zipFilePath);
      console.log(`Cleaned up file: ${zipFilePath}`);
    });
  } else {
    res.status(500).json({ error: 'Failed to create repository.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
