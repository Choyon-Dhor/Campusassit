const path = require('path');
const dotenv = require('dotenv');

const envFiles = [
  '.env',
  '.env.local',
  `.env.${process.env.NODE_ENV}.local`,
].filter(Boolean);

for (const file of envFiles) {
  dotenv.config({
    path: path.join(__dirname, '..', file),
    override: true,
  });
}

