import { Router } from "express";
import { authRouter } from "@/routes/auth";
import { reservationsRouter } from "@/routes/reservations";

export const router = Router();

router.use("/auth", authRouter);
router.use("/reservations", reservationsRouter);
