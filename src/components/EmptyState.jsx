import emptyStateUrl from "../assets/empty-state.svg";

export default function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <img src={emptyStateUrl} alt="" width={140} height={105} />
      <p>{message}</p>
    </div>
  );
}
