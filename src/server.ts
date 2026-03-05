import app from "./app";
import { config } from "./config";
import { connectDb } from "./config/database";
import { logger } from "./utils/logger";

const startServer = async () => {
  try {
    await connectDb();

    app.listen(config.serverPort, () => {
      logger.info(
        `Server listening on port \${config.serverPort} in \${config.env} mode`
      );
    });
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
};

void startServer();
