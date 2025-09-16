import { Router, Response, NextFunction } from "express";
import { models } from "../db";
import { AuthedRequest, authMiddleware, userMiddleware } from "./auth";
import { getErrorMsgMissingParams } from "../utils/validation";
import { getReturnError } from "../utils/routeHelpers";
import { ERROR_500_UKNOWN } from "../constants/statusCodeMessages";

const router = Router()

const { CompletedExercise } = models

router.post('/create', [authMiddleware, userMiddleware], async (_req: AuthedRequest, res: Response, _next: NextFunction): Promise<any> => {
    const { user } = _req
    const { exerciseId, duration } = _req.body

    const invalidParamsOrNull = getErrorMsgMissingParams({ exerciseId, duration })
    if (invalidParamsOrNull) {
        getReturnError(res, invalidParamsOrNull)
        return
    }

    try {
        const newCompletedRecord = await CompletedExercise.create({
            userId: user.id,
            exerciseId,
            duration,
            completedAt: new Date()
        })

        res.status(201).json({
            message: "Record of completing exercise created successfully",
            data: {
                completedExercise: {
                    exerciseId: newCompletedRecord.exerciseId,
                    duration: newCompletedRecord.duration,
                    completedAt: newCompletedRecord.completedAt
                }
            }
        })
    } catch(e) {
        console.error(`[ERROR] /completed-exercises/create : ${e}`)
        res.status(500).json({
            error: ERROR_500_UKNOWN
        })
    }
})

router.delete('/:id/', [authMiddleware, userMiddleware], async (_req: AuthedRequest, res: Response, _next: NextFunction): Promise<any> => {
    const { user } = _req
    const { id } = _req.params

    try {
        const numDeleted = await CompletedExercise.destroy({
            where: {
                id,
                userId: user.id
            }
        })

        let message = "Exercise completion record deleted successfully"
        if (numDeleted === 0) message = "Nothing deleted"

        res.status(200).json({
            message: message,
        })
    } catch(e) {
        console.error(`[ERROR] /completed-exercises/delete : ${e}`)
        res.status(500).json({
            error: ERROR_500_UKNOWN
        })
    }
})

export default router