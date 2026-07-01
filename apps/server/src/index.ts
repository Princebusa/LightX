import express from "express"
import * as dotenv from 'dotenv'
import auth from "./routes/auth.routes"
import cors from "cors"

dotenv.config();

const app = express()

app.use(cors())
app.use(express.json()) 
app.use(express.urlencoded({ extended: true }));

app.use("/auth", auth)

app.listen(process.env.PORT, () => {
    console.log(`server and ws are running on ${process.env.PORT}`)
})