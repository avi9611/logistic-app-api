-- CreateTable
CREATE TABLE "public"."simulation_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "config" JSONB NOT NULL,
    "kpis" JSONB NOT NULL,
    "totals" JSONB NOT NULL,

    CONSTRAINT "simulation_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."simulation_history" ADD CONSTRAINT "simulation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
