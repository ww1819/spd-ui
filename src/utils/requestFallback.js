export function isForbiddenError(err) {
  const code = err && err.code;
  const respCode = err && err.response && err.response.data && err.response.data.code;
  return Number(code) === 403 || Number(respCode) === 403;
}
