import { z } from "zod"

const FileSchema = z.object({
	name: z.string(),
	id: z.string(),
	mime: z.string(),
	time: z.string(),
	selfDestruct: z.boolean().default(false),
	destruct: z.string().nullish().default(null),
	ip: z.string(),
	original: z.string().nullish(),
	views: z
		.array(
			z.object({
				ip: z.string(),
				time: z.string(),
				userAgent: z.string(),
			})
		)
		.default([]),
})

export const validate = (data: any) => {
	return FileSchema.parse(data)
}
