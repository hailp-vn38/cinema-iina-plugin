export function runDeferred(task, onError) {
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
