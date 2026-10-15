interface InlineNoticeProps {
    message: string | null;
    type: 'success' | 'error' | 'info';
}

export default function InlineNotice({ message, type }: InlineNoticeProps) {
    if (!message) return null;

    return (
        <div className={`inline-notice inline-notice-${type}`} role="status">
            <span>{message}</span>
        </div>
    );
}
