const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require('../db/database');
const secretKey = "noIdea";

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const conn = await db.connection();
        const [result] = await conn.query("SELECT * from users WHERE username = ? AND status = 'active'", username);
        const user = result[0];

        if (!user) {
            return res.status(401).send({ message: "Invalid username or password!" });
        }

        const validPassword = await bcrypt.compare(password, user.Password);
        if (!validPassword) {
            return res.status(401).send({ message: "Invalid username or password!" });
        }
        // update last login datetime
        const upd = await conn.query("UPDATE users SET lastaccessed = NOW() WHERE username = ?", username);

        const token = jwt.sign({ username: user.Username, role: user.Role }, secretKey, { expiresIn: "1h" });
        res.cookie("token", token, {
            maxAge: 300000,
            secure: true,
            httpOnly: true,
            sameSite: "none",
        });

        res.send({ message: "Login successful" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal server error' });
    }
};

// user logout
const logout = async (req, res) => {
    res.clearCookie('token');
    res.send({ message: "Logout successful" });
};

module.exports = {
    login, logout, secretKey
}
