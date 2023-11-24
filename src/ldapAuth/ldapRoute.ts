import express from "express";
import { ldapLogin, ldapRegister } from "./authController";

const router = express.Router();
router.use(express.json());

router.route("/login").post(ldapLogin);
router.route("/register").post(ldapRegister);

export default router;
