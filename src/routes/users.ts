import { Router, Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { getReturnError } from '../utils/routeHelpers'
import { ERROR_500_UKNOWN } from '../constants/statusCodeMessages'

const router = Router()

const {
  User
} = models

router.get('/:id', async (_req: Request, _res: Response, _next: NextFunction): Promise<any> => {
  const userId = _req.params.id
  if (!userId || userId === '' || userId === ' ') {
    getReturnError(_res, "Invalid or missing user id")
  }

  try {
    const user = await User.findOne({ where: { id: userId }})
    if (!user) {
      throw new Error("Cannot get user")
    }

    return _res.json({
      data: user,
      message: 'User object'
    })
  } catch(e) {
    console.error(`[ERROR] /users/${userId} : ${e})`)
    getReturnError(_res, ERROR_500_UKNOWN)
  }
})

export default router
