import { Response } from "express"

export const getReturnError = (res: Response, message: string) => {
  return res.status(400).json({ error: message })
}
