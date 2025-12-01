-- CreateTable
CREATE TABLE "LearnerRoadmap" (
    "id" SERIAL NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerSkillProfile" (
    "id" SERIAL NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerSkillProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearnerRoadmap_learner_id_key" ON "LearnerRoadmap"("learner_id");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerSkillProfile_learner_id_key" ON "LearnerSkillProfile"("learner_id");

-- CreateIndex
CREATE INDEX "Credential_metadata_idx" ON "Credential" USING GIN ("metadata" jsonb_path_ops);

-- CreateIndex
CREATE INDEX "Credential_certificate_title_idx" ON "Credential"("certificate_title");

-- AddForeignKey
ALTER TABLE "LearnerRoadmap" ADD CONSTRAINT "LearnerRoadmap_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerSkillProfile" ADD CONSTRAINT "LearnerSkillProfile_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
