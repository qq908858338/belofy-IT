"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PopconfirmProps {
  children: React.ReactNode
  onConfirm: () => void
  onCancel?: () => void
  title?: string
  confirmText?: string
  cancelText?: string
}

export function Popconfirm({
  children,
  onConfirm,
  onCancel,
  title = '确定要执行此操作吗？',
  confirmText = '确定',
  cancelText = '取消',
}: PopconfirmProps) {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  const handleCancel = () => {
    onCancel?.()
    setOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">{title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 bg-gray-800 hover:bg-gray-700 border-gray-600 text-white"
              onClick={handleCancel}
            >
              {cancelText}
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <span
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      >
        {children}
      </span>
    </>
  )
}