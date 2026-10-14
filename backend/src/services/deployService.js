import { Deployment, MAX_LOG_LINES } from '../models/Deployment.js';
import { Service } from '../models/Service.js';

const IN_FLIGHT = ['queued', 'building', 'deploying'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const BUILD_LINES = {
  web: ['Detected Node.js 22 project', 'npm ci', 'added 412 packages in 6.1s', 'npm run build', 'Build output: dist/ (1.8 MB)', 'Exporting image layers'],
  worker: ['Detected Python 3.12 project', 'pip install -r requirements.txt', 'Installed 38 packages', 'Exporting image layers'],
  postgres: ['Pulling postgres:16-alpine', 'Provisioning volume (10 GB NVMe)', 'Initialising cluster'],
  redis: ['Pulling redis:7-alpine', 'Provisioning volume (1 GB NVMe)'],
};

async function log(deployment, line, status) {
  const update = { $push: { logs: { $each: [{ at: new Date(), line }], $slice: -MAX_LOG_LINES } } };
  if (status) update.$set = { status };
  await Deployment.updateOne({ _id: deployment._id }, update);
}

/**
 * Simulated build-and-release pipeline. Swap this for a call to the real orchestrator;
 * it only needs to move the deployment through its statuses and append logs.
 */
export async function runDeployment(deployment, service) {
  try {
    await log(deployment, `Deploying ${service.name}${deployment.commit ? ` @ ${deployment.commit}` : ''}`, 'building');
    for (const line of BUILD_LINES[service.type] ?? BUILD_LINES.web) {
      await wait(700 + Math.random() * 900);
      await log(deployment, line);
    }
    await log(deployment, `Scheduling ${service.replicas} replica(s) with ${service.vcpu} vCPU / ${service.memoryGb} GB`, 'deploying');
    await wait(1500);
    await log(deployment, 'Health check passed');

    await Deployment.updateMany(
      { service: service._id, status: 'active', _id: { $ne: deployment._id } },
      { $set: { status: 'removed', finishedAt: new Date() } }
    );
    await log(deployment, 'Deployment is live', 'active');
    await Deployment.updateOne({ _id: deployment._id }, { $set: { finishedAt: new Date() } });
    await Service.updateOne({ _id: service._id }, { $set: { status: 'active', lastDeployedAt: new Date() } });
  } catch (err) {
    console.error('[Deploy] Failed:', err?.message);
    await Deployment.updateOne({ _id: deployment._id }, { $set: { status: 'failed', finishedAt: new Date() } }).catch(() => {});
    await Service.updateOne({ _id: service._id }, { $set: { status: 'failed' } }).catch(() => {});
  }
}

export async function startDeployment(service, { commit = '' } = {}) {
  const deployment = await Deployment.create({ service: service._id, owner: service.owner, commit });
  await Service.updateOne({ _id: service._id }, { $set: { status: 'deploying' } });
  runDeployment(deployment, service);
  return deployment;
}

/** Deployments interrupted by a restart would otherwise spin forever. */
export async function recoverStaleDeployments() {
  const stale = await Deployment.find({ status: { $in: IN_FLIGHT } }, { service: 1 }).lean();
  if (!stale.length) return;
  await Deployment.updateMany(
    { _id: { $in: stale.map((d) => d._id) } },
    { $set: { status: 'failed', finishedAt: new Date() }, $push: { logs: { at: new Date(), line: 'Interrupted by a platform restart. Redeploy to continue.' } } }
  );
  await Service.updateMany({ _id: { $in: stale.map((d) => d.service) }, status: 'deploying' }, { $set: { status: 'failed' } });
}
