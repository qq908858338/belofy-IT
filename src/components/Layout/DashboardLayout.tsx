import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <h2 className="text-xl font-bold mb-2">页面出错了</h2>
          <p className="text-sm">{this.state.error?.message || '未知错误'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
          >
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}