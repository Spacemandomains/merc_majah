import { Router, type IRouter } from "express";
import healthRouter from "./health";
import artistsRouter from "./artists";
import genresRouter from "./genres";
import statsRouter from "./stats";
import openApiRouter from "./openapi";
import mercMajahMcpRouter from "./merc-majah-mcp";
import merchRouter from "./merch";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/artists", artistsRouter);
router.use("/genres", genresRouter);
router.use("/stats", statsRouter);
router.use(openApiRouter);
router.use("/merc-majah/mcp", mercMajahMcpRouter);
router.use("/merch", merchRouter);

export default router;
