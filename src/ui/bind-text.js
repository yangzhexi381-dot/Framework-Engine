export function bindText(element, state, select) {
  function render(snapshot) {
    element.textContent = select(snapshot);
  }
  render(state.get());
  return state.subscribe(render);
}
