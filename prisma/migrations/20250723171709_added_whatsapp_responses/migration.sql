-- CreateTable
CREATE TABLE "whatsapp_responses" (
    "id" SERIAL NOT NULL,
    "from" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_responses_pkey" PRIMARY KEY ("id")
);
