export const RATES = {
  vcpu: 0.018,
  ram: 0.0045,
  gpu: 1.12,
  nvme: 0.00012,
  hours: 730,
}

export function money(n) {
  if (n < 0.01) return `$${n.toFixed(5)}`
  if (n < 1) return `$${n.toFixed(3)}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function monthlyCost({ vcpu = 0, ram = 0, gpu = 0, disk = 0 }) {
  const hours = RATES.hours
  const parts = {
    vcpu: vcpu * RATES.vcpu * hours,
    ram: ram * RATES.ram * hours,
    gpu: gpu * RATES.gpu * hours,
    disk: disk * RATES.nvme * hours,
  }
  const total = parts.vcpu + parts.ram + parts.gpu + parts.disk
  return { ...parts, total, hours }
}

export const SHAPES = [
  { vcpu: 1, ram: 1, name: 'a single-core hobby API' },
  { vcpu: 1, ram: 2, name: 'a small Node or Python service' },
  { vcpu: 2, ram: 4, name: 'a typical web application' },
  { vcpu: 2, ram: 8, name: 'an app with a modest in-memory cache' },
  { vcpu: 4, ram: 8, name: 'a production API' },
  { vcpu: 4, ram: 16, name: 'a busier API with headroom' },
  { vcpu: 8, ram: 16, name: 'a compute-heavy worker' },
  { vcpu: 8, ram: 32, name: 'a worker that keeps a large working set' },
  { vcpu: 16, ram: 32, name: 'a high-CPU batch job' },
  { vcpu: 16, ram: 64, name: 'a database-sized virtual machine' },
  { vcpu: 4, ram: 64, name: 'a memory-heavy data service' },
  { vcpu: 8, ram: 128, name: 'a large in-memory workload' },
  { vcpu: 2, ram: 8, gpu: 1, name: 'one L40S inference replica' },
  { vcpu: 4, ram: 16, gpu: 1, name: 'an inference replica with a fatter CPU' },
  { vcpu: 8, ram: 32, gpu: 1, name: 'a training or batch GPU job' },
]

export function shapeFor(index, { gpu = false, memory = false, cpu = false } = {}) {
  const pool = SHAPES.filter((s) => {
    if (gpu) return s.gpu
    if (memory) return s.ram >= 32
    if (cpu) return s.vcpu >= 8 && !s.gpu
    return !s.gpu
  })
  return pool[index % pool.length]
}

export function priceParagraph(shape) {
  const cost = monthlyCost(shape)
  const bits = [
    `${shape.vcpu} vCPU (${money(cost.vcpu)})`,
    `${shape.ram} GB RAM (${money(cost.ram)})`,
  ]
  if (shape.gpu) bits.push(`${shape.gpu} L40S GPU (${money(cost.gpu)})`)
  if (shape.disk) bits.push(`${shape.disk} GB NVMe (${money(cost.disk)})`)
  return `${shape.name[0].toUpperCase()}${shape.name.slice(1)}, left on for a 730-hour month, comes to ${bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits.at(-1)}` : bits[0]}. That is about ${money(cost.total)} before tax. The rate card is ${money(RATES.vcpu)} per vCPU-hour, ${money(RATES.ram)} per GB of RAM per hour, ${money(RATES.gpu)} per L40S-hour, and ${money(RATES.nvme)} per GB of NVMe per hour. Billing is per second, so a replica that is off does not bill.`
}
