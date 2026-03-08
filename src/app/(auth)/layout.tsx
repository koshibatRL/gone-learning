export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30">
      <div className="w-full max-w-sm px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            論文模擬採点
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            公務員試験 論文模擬採点サービス
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
