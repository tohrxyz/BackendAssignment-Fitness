import { Router, Request, Response, NextFunction } from 'express'

import { models } from '../db'
import { adminMiddleware, authMiddleware } from './auth'
import { getErrorMsgMissingParams } from '../utils/validation'
import { getReturnError } from '../utils/routeHelpers'
import { ERROR_500_UKNOWN } from '../constants/statusCodeMessages'

const router = Router()

const {
	Exercise,
	Program
} = models


router.get('/', async (_req: Request, res: Response, _next: NextFunction): Promise<any> => {
	const exercises = await Exercise.findAll({
		include: [{
			model: Program
		}]
	})

	return res.json({
		data: exercises,
		message: 'List of exercises'
	})
})

router.post('/create', [authMiddleware, adminMiddleware], async (_req: Request, res: Response, _next: NextFunction): Promise<any> => {
  const { name, difficulty, programID } = _req.body

  const invalidParamsOrNull = getErrorMsgMissingParams({
    name,
    difficulty,
    programID
  })

  if (invalidParamsOrNull) {
    getReturnError(res, invalidParamsOrNull)
    return
  }

  try {
    const newExercise = await Exercise.create({
      name,
      difficulty,
      programID
    })

    res.status(201).json({
      message: "Exercise created successfully",
      data: {
        exercise: {
          name: newExercise.name,
          difficulty: newExercise.difficulty,
          programID: newExercise.program
        }
      }
    })
    return
  } catch(e) {
    console.error(`[ERROR] /exercises/create: ${e}`)
    res.status(500).json({
      error: ERROR_500_UKNOWN
    })
    return
  }
})

router.delete('/:id/', [authMiddleware, adminMiddleware], async (_req: Request, res: Response, _next: NextFunction): Promise<any> => {
  const { id } = _req.params

  const invalidParamsOrNull = getErrorMsgMissingParams({
    id
  })

  if (invalidParamsOrNull) {
    getReturnError(res, invalidParamsOrNull)
    return
  }

  try {
    const numDeleted = await Exercise.destroy({
      where: {
        id
      }
    })

    let message = ""
    if (numDeleted === 0) message += "Nothing deleted"

    res.status(200).json({
      message: message ?? "Exercise deleted successfully",
    })
    return
  } catch(e) {
    console.error(`[ERROR] /exercises/id (delete): ${e}`)
    res.status(500).json({
      error: ERROR_500_UKNOWN
    })
    return
  }
})

router.put('/:id/', [authMiddleware, adminMiddleware], async (_req: Request, res: Response, _next: NextFunction): Promise<any> => {
  const { id } = _req.params
  const { difficulty, name } = _req.body

  const invalidParamsOrNull = getErrorMsgMissingParams({
    id
  })
  if (invalidParamsOrNull) {
    getReturnError(res, invalidParamsOrNull)
    return
  }

  let dataToUpdate = {}

  if (difficulty) {
    dataToUpdate = {
      difficulty
    }
  }

  if (name) {
    dataToUpdate = {
      ...dataToUpdate,
      name
    }
  }

  if (Object.entries(dataToUpdate).length === 0) {
    getReturnError(res, "Nothing to update")
    return
  }

  try {
    void await Exercise.update(dataToUpdate, { where: { id }})
    const updatedExercise = await Exercise.findOne({ where: { id }})

    res.status(200).json({
      message: "Exercise updated successfully",
      data: {
        exercise: {
          name: updatedExercise.name,
          difficulty: updatedExercise.difficulty,
          programID: updatedExercise.program
        }
      }
    })
    return
  } catch(e) {
    console.error(`[ERROR] /exercises/id (update): ${e}`)
    res.status(500).json({
      error: ERROR_500_UKNOWN
    })
    return
  }
})

export default router
