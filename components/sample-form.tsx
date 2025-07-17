'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

const schema = z.object({
  name: z.string().min(1, 'Required'),
})

type FormValues = z.infer<typeof schema>

export default function SampleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver<FormValues>(schema) })

  const onSubmit = (data: FormValues) => {
    console.log(data)
    alert(`Hello, ${data.name}!`)
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Label htmlFor="name">Your name</Label>
      <Input id="name" placeholder="Your name" {...register('name')} />
      {errors.name && (
        <span className="text-sm text-red-500">{errors.name.message}</span>
      )}
      <Button type="submit">Submit</Button>
    </motion.form>
  )
}
