import { createExpressApp } from './infrastructure/http/app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = createExpressApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
