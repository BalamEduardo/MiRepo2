/** Native camera conversion accounts for sensor rotation, preview crop and mirroring. */
function projectFaceBounds(bounds, convertPoint, viewport) {
  if (!bounds || !viewport || viewport.width <= 0 || viewport.height <= 0) return null;
  const { x, y, width, height } = bounds;
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  const corners = [
    { x, y }, { x: x + width, y },
    { x, y: y + height }, { x: x + width, y: y + height },
  ].map(convertPoint);
  if (!corners.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))) return null;
  const left = Math.max(0, Math.min(...corners.map((p) => p.x)));
  const top = Math.max(0, Math.min(...corners.map((p) => p.y)));
  const right = Math.min(viewport.width, Math.max(...corners.map((p) => p.x)));
  const bottom = Math.min(viewport.height, Math.max(...corners.map((p) => p.y)));
  if (right <= left || bottom <= top) return null;
  return { left, top, width: right - left, height: bottom - top };
}

/** Each camera mount owns a session; queued callbacks cannot revive a closed session. */
function createDetectionSession(onFaces, onError, now = Date.now) {
  let closed = false;
  let lastUpdate = -Infinity;
  let lastCount = 0;
  let failed = false;
  return {
    accept(faces) {
      if (closed) return false;
      const time = now();
      const disappeared = faces.length === 0 && lastCount > 0;
      if (!failed && !disappeared && time - lastUpdate < 100) return false;
      lastUpdate = time;
      lastCount = faces.length;
      failed = false;
      onFaces(faces);
      return true;
    },
    fail(error) {
      if (closed || failed) return false;
      failed = true;
      lastCount = 0;
      onError(error);
      return true;
    },
    close() { closed = true; },
  };
}

module.exports = { projectFaceBounds, createDetectionSession };
