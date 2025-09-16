import { Router, Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { getReturnError } from '../utils/routeHelpers'
import { ERROR_500_UKNOWN } from '../constants/statusCodeMessages'
import { adminMiddleware, AuthedRequest, authMiddleware, userMiddleware } from './auth'
import { getErrorMsgMissingParams } from '../utils/validation'

const router = Router()

const {
  User,
  CompletedExercise
} = models

router.get('/profile-data/', [authMiddleware, userMiddleware], async (_req: AuthedRequest, res: Response, _next: NextFunction): Promise<any> => {
  const { user } = _req

  try {
    const completedExercisesForUser = await CompletedExercise.findAll({
      where: {
        userId: user.id
      },
      attributes: ['duration', 'completedAt', 'exerciseId']
    })
    res.status(200).json({
      message: "Your profile user data",
      data: {
        user: {
          name: user.name,
          surname: user.surname,
          nickName: user.nickName,
          email: user.email,
          role: user.role,
          age: user.age,
          completed_exercises: completedExercisesForUser
        }
      }
    })
    return
    } catch(e) {
        console.error(`[ERROR] /users/profile-data : ${e}`)
        res.status(500).json({
            error: ERROR_500_UKNOWN
        })
    }

})

router.get('/all-users', [authMiddleware, userMiddleware], async (_req: AuthedRequest, res: Response, _next: NextFunction): Promise<any> => {
  const limit = Number(_req?.query.limit) ? Number(_req?.query.limit) :  100
  try {
    const users = await User.findAll({ attributes: ['id', 'nickName'], limit })
    res.status(200).json({
      message: "All users",
      data: {
        users
      }
    })
    return
  } catch(e) {
    console.error(`[ERROR] /users/all-users/ : ${e}`)
    res.status(500).json({
      error: ERROR_500_UKNOWN
    })
  }
})

router.get('/:id', [authMiddleware, adminMiddleware], async (_req: Request, _res: Response, _next: NextFunction): Promise<any> => {
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

// all users
router.get('/', [authMiddleware, adminMiddleware], async (_req: Request, _res: Response, _next: NextFunction): Promise<any> => {

  try {
    const users = await User.findAll()
    if (!users) {
      throw new Error("Cannot get user")
    }

    return _res.json({
      data: users,
      message: 'User objects array'
    })
  } catch(e) {
    console.error(`[ERROR] /users/ : ${e})`)
    getReturnError(_res, ERROR_500_UKNOWN)
  }
})

router.put('/:id/', [authMiddleware, adminMiddleware], async (_req: Request, res: Response, _next: NextFunction): Promise<any> => {
  const { id } = _req.params
  const { name, surname, nickName, age, role } = _req.body

  const userData = {
    name, surname, nickName, age, role
  }

  const dataToUpdate = Object.fromEntries(
    Object.entries(userData).filter(([_, value]) => value && value !== " ")
  )

  // this checks if specified have value
  const invalidParamsOrNull = getErrorMsgMissingParams(dataToUpdate)
  if (invalidParamsOrNull) {
    getReturnError(res, invalidParamsOrNull)
    return
  }

  // this checks if there are properties to update at all
  if (Object.entries(dataToUpdate).length === 0) {
    getReturnError(res, "Nothing to update")
    return
  }

  try {
    void await User.update(dataToUpdate, { where: { id }})
    const updatedUser = await User.findOne({ where: { id }})

    res.status(200).json({
      message: "User updated successfully",
      data: {
        user: {
          name: updatedUser.name,
          surname: updatedUser.surname,
          nickName: updatedUser.nickName,
          age: updatedUser.age,
          role: updatedUser.role
        }
      }
    })
    return
  } catch(e) {
    console.error(`[ERROR] /user/id (update): ${e}`)
    res.status(500).json({
      error: ERROR_500_UKNOWN
    })
    return
  }
})

export default router
