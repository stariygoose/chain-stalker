import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { container } from "#di/inversify.config.js";
import { TYPES } from "#di/types.js";
import { IServerConfig } from "#presentation/config/server.config.js";

const server: IServerConfig = container.get(TYPES.ServerConfig);

await server.start();
