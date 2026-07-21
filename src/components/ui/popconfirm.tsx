import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
    <TooltipProvider delayDuration={0}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="flex flex-col gap-2 p-3 bg-gray-900 text-white border-0 shadow-lg">
          <p className="text-sm font-medium">{title}</p>
          <div className="flex gap-2">
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}