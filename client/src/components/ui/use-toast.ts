import * as React from "react"

// Inspired by react-hot-toast library

type ToastAction = {
  label: string
  onClick: () => void
}

type Toast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastAction
  duration?: number
  variant?: "default" | "destructive"
}

type ToasterToast = Toast & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastAction
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ActionType = {
  type: "ADD_TOAST" | "UPDATE_TOAST" | "DISMISS_TOAST" | "REMOVE_TOAST"
  toast?: ToasterToast
  toastId?: string
}

let count = 0

function genId() {
  count = (count + 1) % 100
  return count.toString()
}

type State = {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId: toastId })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: ActionType): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast!, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast!.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: ActionType) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type ToastOpts = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastAction
  duration?: number
  variant?: "default" | "destructive"
}

function toast(opts: ToastOpts) {
  const id = genId()

  const newToast: ToasterToast = {
    ...opts,
    id,
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) dismissToast(id)
    },
  }

  dispatch({ type: "ADD_TOAST", toast: newToast })

  return {
    id: id,
    dismiss: () => dismissToast(id),
    update: (props: ToasterToast) => updateToast(id, props),
  }
}

function dismissToast(toastId: string) {
  dispatch({ type: "DISMISS_TOAST", toastId })
}

function updateToast(toastId: string, props: ToasterToast) {
  dispatch({ type: "UPDATE_TOAST", toast: { id: toastId, ...props } })
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: dismissToast,
  }
}

export {
  useToast,
  toast,
}
