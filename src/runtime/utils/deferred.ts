export function runDeferred(
  task: () => void | Promise<void>,
  onError?: (error: unknown) => void,
): void {
  setTimeout(() => {
    Promise.resolve()
      .then(task)
      .catch((error) => {
        if (onError) {
          onError(error);
          return;
        }

        throw error;
      });
  }, 0);
}
