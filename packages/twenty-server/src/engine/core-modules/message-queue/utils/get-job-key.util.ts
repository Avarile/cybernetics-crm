// Builds the BullMQ job scheduler key from a job name and optional job id
export const getJobKey = ({
  jobName,
  jobId,
}: {
  jobName: string;
  jobId?: string;
}) => {
  return `${jobName}${jobId ? `.${jobId}` : ''}`;
};
