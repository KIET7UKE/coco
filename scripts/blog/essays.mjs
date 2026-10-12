/** Subject knowledge used by the SEO articles. Each essay is about one thing. */
export const essays = {
  render: {
    name: 'Render',
    text: `Render is a platform as a service. You connect a Git repository, pick a service type (web, private, background worker, cron, or static), and Render builds and runs it. Managed Postgres and key-value stores sit in the same dashboard. Preview environments track pull requests. The trade is that you rent an instance size Render defines. A service that is quiet overnight still occupies that instance unless you use a plan that allows spin-down, and bandwidth is easy to underestimate once you serve images or large API payloads. GPUs, custom kernels, and a machine you can partition core by core are outside the product. Teams start comparing alternatives when a worker, a database, and a web process all need different shapes and the invoice is a stack of instance SKUs.`,
  },
  railway: {
    name: 'Railway',
    text: `Railway is built for shipping from a repo with very little configuration. Services, volumes, and databases share a project, and usage-based pricing replaced the older hobby subscription for a lot of accounts. That feels fair until a few replicas, a volume, and egress land on the same bill, or until a build cache miss makes deploys slow. Railway is not a place to rent a specific CPU generation or to pin a GPU. It is a place to get a container on the internet quickly. The comparison with Coco starts when you want that same repo-to-running path and you also want the price to read as vCPU-hours and gigabyte-hours, with a private network for workers that should never be public.`,
  },
  heroku: {
    name: 'Heroku',
    text: `Heroku taught a generation of developers to git push an app and get a URL. Dynos are the unit of compute. Add-ons cover databases, caches, and logging. The model is still comfortable for a small app, and it is expensive once you need more than a couple of standard dynos, a production database, and log drains. Buildpacks hide the operating system, which is helpful until you need a system library, a GPU, or a long-running process that does not fit the dyno lifecycle. Heroku remains a managed application platform. It is a weak fit for dedicated CPU, bare metal, or inference.`,
  },
  hetzner: {
    name: 'Hetzner',
    text: `Hetzner Cloud and Hetzner dedicated auctions are popular because the hardware is cheap, especially in Germany and Finland. You get a real VM or a real server, root access, and a price that undercuts most US clouds. You also get the rest of the job: images, firewalls, backups, load balancers, and the monitoring you wire up yourself. Bandwidth allowances are generous compared with hyperscalers, which is why data-heavy apps move there. The gaps are product surface and geography. If your users are in the United States, a Helsinki VM is the wrong default. If you want git deploys, preview environments, a published vCPU hour, and GPUs on the same account as the VM, you are assembling that yourself on top of Hetzner.`,
  },
  fly: {
    name: 'Fly.io',
    text: `Fly.io runs containers close to users on hardware it operates around the world. Volumes, private networking, and Machines that can stop when idle are the core ideas. It is a strong fit for a small API that should wake near the user, and for apps that care about regional placement. The sharp edges are operational: volume restores, machine sizing, and surprising bills when machines do not stop. Fly is not a dedicated-server product and it is not where most teams train models. Use it when latency placement is the feature. Look elsewhere when you want a plain vCPU and RAM price and a GPU in the same project.`,
  },
  digitalocean: {
    name: 'DigitalOcean',
    text: `DigitalOcean Droplets are the default simple VM: a size, an image, a region, a monthly price. App Platform sits on top for people who do not want to manage the VM. Managed databases, Kubernetes, and Spaces (object storage) round out the catalog. The appeal is a short price page and documentation that assumes one developer. The limit is the same as most VM clouds. You still patch the OS if you use Droplets, you still size disks up front, and GPU availability is a separate, smaller product. Bandwidth overage and extra volumes are where a "simple" bill stops being simple.`,
  },
  vultr: {
    name: 'Vultr',
    text: `Vultr sells cloud compute, bare metal, and GPUs in a long list of cities, with hourly billing and a regular cadence of new locations. Developers pick it for price and for a city that the bigger clouds treat as an edge. The console is enough to launch a VM and not much of a platform: deploys, preview apps, and a private network between a web process and a worker are your problem. Support and noisy-neighbor stories vary by plan, which is the usual tax on low-cost virtualization. Comparing Vultr with Coco is a comparison between renting a city-specific VM and running the app on metered vCPU, RAM, and GPU with the deploy path included.`,
  },
  gcp: {
    name: 'Google Cloud',
    text: `Google Cloud is a hyperscaler. Compute Engine, Cloud Run, GKE, Cloud SQL, and a deep IAM and billing model are the reasons enterprises sign up. Committed use discounts reward prediction. The console rewards specialists. A small team can run a Cloud Run service in an afternoon and then lose a week to VPC, IAM, and a bill that itemizes SKUs they did not mean to enable. Egress, logging ingestion, and idle IP addresses are the usual surprises. Google Cloud is the right tool when you need that ecosystem. It is a heavy tool when the job is "run this container and this worker and show me the vCPU price."`,
  },
  azure: {
    name: 'Microsoft Azure',
    text: `Azure is the default cloud where the rest of the company is already on Microsoft: Entra ID, Office, and existing enterprise agreements. Virtual machines, App Service, AKS, and a large marketplace are all there. So is the complexity. VM families, reservations, hybrid benefit, and region quotas make the first instance slower than the tutorial implies. Pricing pages are precise and hard to read. Azure is justified when identity, compliance scope, or a Microsoft contract decides the location of the data. It is a poor default for a startup that wants a server, a GPU, and an invoice that matches the hours the process ran.`,
  },
  aws: {
    name: 'AWS EC2',
    text: `EC2 is the original cloud VM, and the instance catalog is now a profession. Families encode CPU generation, burstable behavior, memory ratio, local disk, and network bandwidth. Savings plans and reserved instances cut the rate if you commit. The list price of an always-on instance is rarely what you pay, and it is rarely what you expected after EBS, data transfer, Elastic IPs, and CloudWatch. EC2 is unbeatable when you need a specific instance family in a specific region with the rest of AWS beside it. It is a lot of surface area when you want four cores and eight gigabytes for an API.`,
  },
  lightsail: {
    name: 'Amazon Lightsail',
    text: `Lightsail wraps a slice of AWS in bundles: a few sizes of VM, a bandwidth allowance, a static IP, and optional databases and containers. The price is the point. You know the monthly number. The ceiling is also the point. You do not get the full EC2 catalog, GPU choice is limited, and leaving Lightsail for the rest of AWS is a migration, not a toggle. Teams use it for a WordPress box or a small API. They outgrow it when they need more than the bundle, a private fleet, or a GPU.`,
  },
  vercel: {
    name: 'Vercel',
    text: `Vercel is the platform most frontend teams mean by "just deploy the Next.js app." Previews per pull request, a global cache, and serverless functions are the product. It is excellent at the edge of a web app and awkward as a home for a long-running API, a queue worker, a database, or a GPU. Function duration, memory, and bandwidth become the bill. A backend that holds a websocket or a 20-minute job does not belong in a serverless function. Keep the frontend on Vercel if that workflow is paying for itself, and run the processes that need a real CPU on a cloud built for them.`,
  },
  netlify: {
    name: 'Netlify',
    text: `Netlify made static hosting and form handling feel finished: connect the repo, get previews, ship a CDN. Functions and background work were added later. The platform still fits content sites, documentation, and frontends that call an API somewhere else. It is not a VM, not a GPU cloud, and not a comfortable place for a stateful server. Bandwidth and function overages are how a quiet site becomes a loud invoice. If the thing you are deploying is a container that runs all day, you want a compute platform, not a site host that grew functions.`,
  },
  scaleway: {
    name: 'Scaleway',
    text: `Scaleway is a European cloud with instances, bare metal, Kubernetes, object storage, and a reputation for straightforward prices in euros. It shows up on shortlists that also include OVHcloud and Hetzner when the requirement is "EU company, root access, no hyperscaler contract." You operate the instances yourself. Developer workflow (previews, app deploys, a published hourly app meter) is not the center of the product. Pick Scaleway when the legal entity and the region drive the decision. Compare the hour price of a VM with a metered vCPU if the thing you actually run is an application, not a fleet you want to assemble.`,
  },
  cloudflare: {
    name: 'Cloudflare',
    text: `Cloudflare is a network. DNS, CDN, WAF, R2, and Workers are why it sits in front of other clouds. Workers are a JavaScript and WASM runtime at the edge, not a Linux server. There is no general-purpose vCPU you can SSH into, and GPU instances are not the product developers mean when they say Cloudflare. Replacing Cloudflare usually means replacing the CDN and the DNS, which you may not want to do. Replacing the origin is a different decision. Coco is an origin: the place the app, the worker, and the GPU run. Cloudflare can still be the front door.`,
  },
  linode: {
    name: 'Linode (Akamai)',
    text: `Linode, now part of Akamai, is a long-running VPS and cloud brand. Shared and dedicated CPU plans, Kubernetes, and managed databases cover the usual developer shortlist. Akamai's network is the strategic reason the acquisition happened, not a reason the VM console suddenly became a platform. You still choose a plan size, still manage the OS on a VM, and still assemble deploys. The comparison is with other VPS providers and with clouds that bill the app's actual cores and memory instead of a bundled plan.`,
  },
  ovh: {
    name: 'OVHcloud',
    text: `OVHcloud sells VPS, public cloud instances, and bare metal, with a strong presence in Europe and Canada and a history in dedicated servers. Prices are aggressive. The control panel and the support experience are the things people warn each other about, fairly or not, and the range of products is wide enough to pick the wrong one. Bare metal from OVH is a real server you administer. It is not an application platform. Use it when you want hardware and you have someone to run it. Use an app cloud when you want the application running and the hardware to stay someone else's job.`,
  },
  hyperscalers: {
    name: 'the hyperscalers',
    text: `Hyperscalers are the clouds that own global regions, custom silicon, and an enterprise sales motion. The usual list is Amazon Web Services, Microsoft Azure, and Google Cloud. Alibaba Cloud belongs on the list for Asia. Oracle Cloud and IBM Cloud are sometimes included because of their enterprise footprint, though most developers do not mean them first. A hyperscaler is the right place for a company that needs many regions, a specific compliance package, and a hundred other products in one contract. It is an expensive place to learn, in time even more than in dollars. Neo clouds and developer clouds exist because most applications need a fraction of that catalog: compute, memory, disk, a GPU, a deploy, and a bill.`,
  },
  python: {
    name: 'Python',
    text: `Python on a server is usually one of three shapes. A web process (Django, Flask, FastAPI) behind a process manager. A worker that pulls jobs from a queue and should not be on the public internet. A data or ML job that wants cores, RAM, or a GPU and then should exit. Shared hosts and tiny PaaS dynos struggle with the third shape and often overcharge the second. Package installs need a real build environment when wheels are missing. A platform that accepts a repo or a container, gives the web process a URL, and lets the worker share a private network is the one that matches how Python apps are actually split.`,
  },
  node: {
    name: 'Node.js',
    text: `Node.js hosting fails in a specific way: the process is fine until it is not allowed to stay running. Serverless timeouts cut off websockets, SSE, and anything that listens. A single CPU-bound request blocks the event loop, so "one small dyno" falls over under a sync workload that a second process would have isolated. Production Node is a web process plus a worker plus a place for the build (native modules, sharp, prisma). You want a real process, a private address for the worker, and a price that follows CPU and memory rather than a request pack.`,
  },
  javascript: {
    name: 'JavaScript',
    text: `JavaScript is both the browser app and the server. The browser app is static files and benefits from a CDN. The server is Node, Bun, or Deno and needs a process. Platforms that only host the static half will still take your money for the server half and then time it out. Split the decision. Put the compiled frontend where previews and caching are excellent if you want. Put the API, the websocket, and the job runner on compute you can size. Coco is the second half, and it can also serve the first if you would rather run one container than two vendors.`,
  },
  java: {
    name: 'Java',
    text: `Java costs memory before it costs CPU. A modest Spring or Quarkus service with a 512 MB heap, metaspace, and the OS will not fit in the smallest PaaS slot, and it will garbage-collect badly if you pretend it will. JVM flags, a real disk for logs, and a process that is allowed to run for weeks matter more than a git-push animation. High-RAM instances are the relevant shopping list. So is a worker VM for batch jobs that should not steal heap from the web process. Coco covers that high RAM inside $20 of monthly credits, then meters additional usage at $0.015 per vCPU hour.`,
  },
  react: {
    name: 'React',
    text: `A React app is static files after the build, unless it is a server-rendered app (Next.js, Remix) that needs a Node process. Treating every React app as a serverless frontend is how teams end up with a beautiful preview workflow and an API living on a second platform by accident. If the app is a client bundle, a static host is enough. If it renders on the server, talks to a database, or keeps a websocket, it needs a process with CPU and memory. Preview environments still matter: Coco can build from the repo and promote a preview when you are ready.`,
  },
  tailwind: {
    name: 'Tailwind CSS',
    text: `Tailwind is a build step, not a runtime. The hosting question is about the app the CSS ships with. The compiler runs in CI or in the image build, and the browser downloads a stylesheet. Nothing about Tailwind requires a special cloud. What it does require is a build that is allowed to run Node, and a place to put the result. If that result is a static site, cache it. If the app is a full-stack server that happens to use Tailwind, host the server. Pages that rank for "Tailwind hosting" are usually people trying to deploy a frontend and discovering their host cannot run the API in the same project.`,
  },
  typescript: {
    name: 'TypeScript',
    text: `TypeScript compiles away. Production runs JavaScript, or a bundler output, or a container that already ran tsc. Hosts that advertise TypeScript support usually mean "we run Node and your build script." The useful questions are whether the build has enough memory, whether typecheck failures fail the deploy, and whether the runtime is a long-lived process or a function with a timeout. A monorepo with a shared package needs a build that can see the whole repo. Coco builds from the repo or the image you give it, then runs the process on vCPU and RAM you can see on the invoice.`,
  },
  rust: {
    name: 'Rust',
    text: `Rust services are small at runtime and heavy at compile time. A host that bills a large machine for the running binary is the wrong shape, and a host that kills the build because compilation exceeded a tiny builder is the other wrong shape. Ship a container if you want the compile to happen in CI on a big machine and the run to happen on a small one. Axum, Actix, and a background worker compile to binaries that sit happily on a single vCPU with a gigabyte of RAM. GPU work is a separate process. Coco can run the container and, when you need it, a GPU beside it.`,
  },
  kotlin: {
    name: 'Kotlin',
    text: `Server-side Kotlin is a JVM. Ktor and Spring Boot have the same memory shape as Java: the heap is the bill, not the language. Android builds are a different workload, a CI machine with CPU and disk, not a public web process. Host the API on enough RAM that the garbage collector is quiet, and host the Gradle build on a worker that can disappear after the job. Hourly billing matters for CI. A monthly VM that sits idle between merges is how Kotlin teams overpay. Coco meters additional usage at $0.015 per vCPU hour, whether that process is Ktor or a build container.`,
  },
  sql: {
    name: 'SQL',
    text: `SQL hosting means the database process: Postgres most often, sometimes MySQL. It wants durable disk, RAM for cache, and a private address the app can reach without a public port. A cheap VPS with Postgres installed by hand is honest and fragile. A managed database is safer and often priced like a small instance you cannot shrink at night. Coco is a compute cloud: you can run Postgres in a container or on a VM with NVMe, on the same private network as the app. You still own backups and failover if you run it yourself. Say that out loud before you move a production database.`,
  },
  unity: {
    name: 'Unity',
    text: `Unity in the cloud is rarely the editor. It is dedicated game servers, matchmaking workers, and build machines that run Unity headless. Those processes want real CPU, sometimes real RAM, and a long life for the duration of a match, then nothing. A PaaS that sleeps your process, or a serverless function with a timeout, will drop players. A VPS works if you enjoy operating it. Coco fits the shape: a container or a VM with a known vCPU price, root access when the game server needs it, and additional usage at $0.015 per vCPU hour so an idle month is not the default bill.`,
  },
  app: {
    name: 'application hosting',
    text: `Application hosting is the layer above a VM. The input is a repo or an image. The output is a process with a URL, logs, a way to scale, and a bill. You should not have to assemble TLS, a load balancer, and a deploy script before the first request. You should still be able to drop to a real machine when the app needs a GPU, a custom binary, or root. Coco sits in that middle. Point it at the code, let it detect the runtime, and place the process on Coco's servers. Public endpoints get TLS. Internal services talk on a private network.`,
  },
  api: {
    name: 'API hosting',
    text: `An API process is long-lived, latency-sensitive, and usually boring to operate, which is why it ends up on a platform that cannot run a worker beside it. You want a stable address, health checks, a private path to the database, and the ability to run more than one replica. You do not want a 30-second function timeout or a VM you patch by hand for a JSON service. Coco runs the API as a service, meters the vCPU and RAM, and lets a queue worker share the network without a public port. That split is the whole design of a production API.`,
  },
  worker: {
    name: 'background workers',
    text: `Workers pull jobs and exit or loop. They should not have a public URL. They should be allowed to run longer than a web request. Platforms that only sell web dynos either forbid this or charge you for a web process that never serves traffic. The right setup is a private service, its own CPU and memory, and a queue the web process can see. Scale the worker when the queue grows and stop it when the queue is empty so the meter stops. Coco bills additional usage at $0.015 per vCPU hour. A cron container is the same idea on a schedule.`,
  },
  docker: {
    name: 'Docker',
    text: `A container is the unit of deploy that survives a change of cloud. If your app is an image, you can leave a PaaS that only accepts buildpacks. Docker hosting should mean: give us the image, we run it, we put it on a private network, we terminate TLS if it is public. It should not mean you now operate a cluster. Kubernetes is optional. Most products need one web container, one worker container, and a database. Coco runs those containers on its own servers and prices additional usage at $0.015 per vCPU hour after $20 in monthly credits.`,
  },
  kubernetes: {
    name: 'Kubernetes',
    text: `Kubernetes is a control plane for many containers, rolling deploys, and teams that already have someone who wants that job. It is also how a three-service product acquires a platform team. Hosted Kubernetes still leaves you the YAML, the ingress, the upgrades, and the bill for idle nodes. Use a cluster when you have many services, several environments, and people who will keep it patched. For a smaller fleet, running the containers directly is the smaller system. Coco will run the containers either way you arrive: as an app from a repo, or as images you already build in CI.`,
  },
  postgres: {
    name: 'PostgreSQL',
    text: `Postgres wants RAM, a disk that does not vanish, and a network path that is not the public internet. Managed Postgres from a PaaS is convenient and priced as a always-on instance. Running it yourself is cheaper and makes backups your problem. On Coco the database can be a container with NVMe, on the private network next to the app. Take a backup before you believe any sentence on this page. Replication and point-in-time recovery are operating choices, not a checkbox the marketing site can make for you.`,
  },
  redis: {
    name: 'Redis',
    text: `Redis is memory with a protocol. The bill should look like RAM, because that is what you are buying. Persistence is a disk decision you should make on purpose. A cache that restarts empty is fine. A queue that restarts empty is an incident. Host Redis on a private address, size the memory for the working set plus fragmentation, and do not expose the port. Coco covers high RAM inside $20 of monthly credits, with additional usage at $0.015 per vCPU hour, so a cache is a number you can plan before you launch it. The app reaches it over the private network.`,
  },
  microservices: {
    name: 'microservices',
    text: `Microservices are a networking problem that looks like a code problem. Each service needs a private name, a limit on CPU and memory, and a deploy that does not require the others to move. A platform that gives every service a public URL and a shared dyno size makes the mess more expensive. Start with two or three processes, not twenty. Coco puts them on one private network, terminates TLS at the edge, and lets you scale the one service that is actually busy. If you cannot name the team that owns a service, it should not be a service yet.`,
  },
  cicd: {
    name: 'CI and CD',
    text: `Build machines are burst compute. They need a lot of CPU for a few minutes and then they should cost zero. A reserved runner that sits idle all week is a silent line item. Hosted CI minutes are convenient until the minute price and the concurrency cap show up. A container on Coco used as a runner, with additional usage at $0.015 per vCPU hour, matches the shape of a build. The deploy half is separate: Coco builds from the repo, can stand up a preview, and promotes it. Use the same account for the runner and the app if you want one bill.`,
  },
  sandbox: {
    name: 'sandboxes',
    text: `A sandbox is a place where code from a user, an agent, or a pull request can run without touching production. It needs a time limit, a CPU and memory limit, and a network that is not your office LAN. Containers are the usual boundary. They are not a perfect security boundary, so do not put secrets in the image and do not let the sandbox dial your database. Coco can run that container on metered compute and throw it away. A $0.015 per vCPU hour meter, after $20 in monthly credits, is what makes a sandbox affordable. A monthly VM per customer is what makes it a bad business.`,
  },
  websocket: {
    name: 'WebSockets',
    text: `WebSockets need a process that stays up and a load balancer that does not time the connection out at thirty seconds. Serverless platforms fail this in the documentation and then fail it again in production. You also need to know which replica holds the socket, or you need a broker so any replica can publish. That is ordinary engineering on a VM or a container, and it is a fight on a function platform. Coco runs the process as a service with TLS at the edge. Size the RAM for the connections you actually hold, not for an imaginary million.`,
  },
  startup: {
    name: 'startups',
    text: `A startup cloud bill fails in two directions: a hyperscaler account with seventeen services nobody remembers, or a PaaS that was cheap at one dyno and brutal at ten. The useful constraints are a spending cap, a price you can recompute from vCPU and RAM, and a path that does not change when you add a worker or a GPU. Coco starts with $20 in monthly credits for 24 GB RAM, 24 vCPU, and up to 48 replicas, then meters additional usage at $0.015 per vCPU hour. You do not need a reserved instance to be allowed to grow, and you should not pay for a region you are not using.`,
  },
  affordable: {
    name: 'affordable hosting',
    text: `Affordable does not mean the smallest sticker. It means the bill matches the hours the process ran, the gigabytes it held, and the GPU it used, with no egress surprise you cannot explain to a teammate. A $4 VPS is not affordable if you spend a day a month patching it. A $20 dyno is not affordable if half of that is idle overnight. Coco publishes the offer: 24 GB RAM, 24 vCPU, and up to 48 replicas inside $20 of monthly credits, then $0.015 per vCPU hour. Turn extra replicas off when you do not need them. That arithmetic is the whole pricing philosophy.`,
  },
  vcpu: {
    name: 'vCPU',
    text: `A vCPU is a slice of a physical core scheduled onto your process. Clouds differ on whether that slice is shared, burstable, or dedicated. A burstable core looks cheap until the credit balance runs out and the API stalls. Dedicated cores cost more and behave the same at 3am as at noon. Coco's published rate after the $20 monthly credit is $0.015 per vCPU hour. The starting shape is 24 vCPU and 24 GB RAM, not a fractional core. Ask what the core is shared with before you compare that number to a VPS plan that says "1 CPU" and means a fraction of one.`,
  },
  ram: {
    name: 'RAM',
    text: `Memory is the resource people underbuy and then misdiagnose as a CPU problem. Databases, JVMs, caches, and model weights all live or die by RAM. Coco's starting shape is 24 GB RAM with 24 vCPU inside $20 of monthly credits. Additional usage is $0.015 per vCPU hour. High-RAM shapes (many gigabytes per core) suit caches and heaps. High-CPU shapes suit encoding, builds, and request fan-out. Pick the ratio from the process, not from a bundle that doubles both when you only needed one.`,
  },
  dedicated: {
    name: 'dedicated CPU',
    text: `Dedicated CPU means the core is not in a bursting pool with the neighbor's cron job. It matters for latency-sensitive APIs, game servers, and anything with a tail latency you have promised. It does not mean a whole physical machine unless you asked for bare metal. On a virtualization platform the distinction is the scheduler: your vCPU maps to a core you are allowed to use continuously. Coco's dedicated and high-CPU shapes are how you buy that behavior. Additional usage is still $0.015 per vCPU hour. You are paying for the right to use the core, not for a mystery share.`,
  },
  hourly: {
    name: 'hourly compute',
    text: `Hourly compute is the honest unit. A batch job should be priced from the vCPU hours it uses, and a preview environment that lives for two hours should not pay for a month. Reserved instances flip this: you pay even when the machine is idle, in exchange for a lower rate. That trade is rational at steady utilization and wasteful for everything else. Coco meters additional usage at $0.015 per vCPU hour after $20 in monthly credits. There is no reservation to sign.`,
  },
  vps: {
    name: 'VPS hosting',
    text: `A VPS is a virtual machine with an operating system you administer. Developers still choose one when they want root, a long-lived disk, and a price in the single digits. The hidden cost is operations: updates, firewalls, backups, and the afternoon the disk fills. A VPS is the right tool for a custom stack or a game server. It is a clumsy tool for a web app you deploy three times a day. Coco can give you the VM with root, and it can also run the app from the repo so you are not SSHing to deploy. Use the degree of control the workload actually needs.`,
  },
  cheapvps: {
    name: 'cheap VPS',
    text: `The cheapest VPS plans are shared cores, thin disks, and a support inbox that answers tomorrow. They are fine for a personal project and a bad place for a checkout API. Compare the renewal price, not the first-month coupon. Compare the bandwidth cap. Compare whether "1 vCPU" is a dedicated thread or a token on a busy host. Coco's starting offer is 24 GB RAM, 24 vCPU, and up to 48 replicas inside $20 of monthly credits, then $0.015 per vCPU hour. If a provider is far below that, you are paying in noise, support, or a CPU that is not yours.`,
  },
  baremetal: {
    name: 'bare metal',
    text: `Bare metal is a physical server without a hypervisor between you and the cores. You get the disks, the NICs, and the noisy neighbors you do not have. You also get hardware failure, a longer provision time, and a monthly commit on many hosts. It wins for databases that want the whole page cache, for game servers that hate jitter, and for GPU boxes. It loses for a service you wanted to scale for an hour. Coco's servers are Intel Xeon and AMD EPYC machines, typically 192 cores, with NVMe SSDs. The slice you rent can be a high-RAM replica. Ask for the machine when the workload cannot share.`,
  },
  root: {
    name: 'root access',
    text: `Root access means you can install the package, change the sysctl, and also destroy the disk. Platforms that hide the OS are safer for a standard web app and useless for a custom kernel module, a VPN, or a game server that wants a specific UDP setup. Coco is aimed at developers who sometimes need the machine and usually need the app to deploy itself. Take root on the VM or the dedicated server. Leave the application services on the managed deploy path. Do not run production as root in the application process itself.`,
  },
  gpu: {
    name: 'GPUs',
    text: `Coco is a major AI NeoCloud built for AI inference. The same account also offers 24 GB RAM, 24 vCPU, and up to 48 replicas inside $20 of monthly credits, then $0.015 per vCPU hour. Inference is often one card and a small CPU. Training and batch jobs want more memory and a defined end time so the meter stops. Renting a GPU by the month from a VPS vendor is simpler to read and worse if the card is idle on Saturday. A neocloud is this category: GPUs and the infrastructure around them, without a hyperscaler contract.`,
  },
  inference: {
    name: 'inference',
    text: `Inference hosting is a model, a GPU, and an endpoint that answers. It is not a training cluster. The expensive mistakes are leaving the GPU attached when traffic is zero, and sizing a giant card for a model that fits on a smaller accelerator. An endpoint is a normal service: health checks, logs, a private path if only your API should call it, and a public path if customers do. Coco runs that service as AI inference on the same account, with additional usage at $0.015 per vCPU hour. Put the tokenizer and the web API on ordinary vCPU if they do not need the card. The GPU line on the bill should be the model, not the whole company.`,
  },
  llm: {
    name: 'LLM inference',
    text: `LLM inference is weights in GPU memory and a queue of prompts. Latency depends on the card, the batch, and whether you are streaming tokens. Hosting it yourself makes sense when the model is private, the volume is steady enough to beat an API markup, or the data cannot leave. It does not make sense as a default for a prototype that could call an API. When you do host it, separate the GPU process from the application database, cap the spend, and scale to zero if nights are quiet. Coco bills additional usage at $0.015 per vCPU hour, so the quiet hours stay on a rate you can read.`,
  },
  neocloud: {
    name: 'an AI neocloud',
    text: `A neocloud sells accelerated compute without pretending to be every Amazon product. The category grew up around NVIDIA GPUs, then around inference and training for companies that could not get quota at a hyperscaler. Coco is [Hibarri](https://hibarri.com)'s AI NeoCloud: high-RAM compute and AI inference on one account. The general-purpose half matters. Agents, APIs, and workers are CPU jobs that happen to sit next to a model. A GPU-only vendor makes you run the rest of the product somewhere else. A hyperscaler will sell you all of it and a certification program.`,
  },
  vgpu: {
    name: 'vGPU',
    text: `A vGPU is a fraction of a physical GPU, scheduled like a vCPU. It can be the right size for a small model, a notebook, or a preview. It is the wrong size when you need the full card's memory, because weights do not fractionally fit just because the scheduler says so. Confirm whether you are buying a slice or a dedicated card before you compare hourly prices. Coco's published compute rate after the credit is $0.015 per vCPU hour, on Intel Xeon and AMD EPYC servers, not a token price. Use a slice only when the model and the CUDA job fit in the slice's memory.`,
  },
  privategpu: {
    name: 'private GPU',
    text: `Private GPU means the card and the data path are not a shared notebook server. The model weights, the prompts, and the disks are in your project, on a network you control. That is the requirement from teams who cannot send documents to a public model API. It is also more work: you patch the image, you watch the disk, you rotate keys. Coco runs that GPU as your instance, with additional usage at $0.015 per vCPU hour, and a private network to the API that is allowed to call it. "Private" is not a magic isolation proof. Treat the machine as production.`,
  },
  agents: {
    name: 'AI agents',
    text: `An agent is a loop: a model call, a tool call, some state, a timeout. The model call may be a GPU or someone else's API. The loop itself is ordinary compute, and it is spiky. One user task can mean fifty tool calls and two hours of a browser sandbox. Hosting agents on a web dyno fails the timeout. Hosting them on a GPU fails the budget, because most of the loop is not on the GPU. Give the agent a CPU sandbox with a hard memory cap, a private network, and a kill switch. Put the model on a GPU endpoint only for the steps that need it. Coco meters additional usage at $0.015 per vCPU hour.`,
  },
  bots: {
    name: 'bots',
    text: `Bots are long-lived processes that talk to someone else's API: chat platforms, browsers, inboxes, games. They need a stable process more than they need a big core. They also need a place to park secrets and a way to restart without duplicating messages. A $5 VPS does this until the disk fills or two copies poll the same queue. Run the bot as a single replica with a restart policy, on a private network if it calls your own API, and with a spend limit. Scale out only when you have a real concurrency story, not because a dashboard offered a slider.`,
  },
  autonomous: {
    name: 'autonomous systems',
    text: `Autonomous here means software that takes actions without a person on each step: an agent that files the ticket, a worker that resizes a fleet, a bot that posts. The infrastructure question is blast radius. The process needs identity, logs, a budget, and a network that cannot reach things it should not touch. Give it a sandbox container, a short credential, and a queue you can pause. Do not give it the production database password because that was faster. Coco runs the sandbox and the API it is allowed to call as separate services. You can stop the sandbox without stopping the product.`,
  },
  cost: {
    name: 'cloud cost',
    text: `Cloud cost falls when you stop paying for idle, stop paying for a SKU you cannot explain, and stop splitting one product across three vendors who each add a minimum. The practical moves are: meter the vCPU hour, cap the project, put the worker and the web process on shapes that match them, and keep GPUs off when nobody is prompting. Coco includes $20 of credit a month, aimed at 24 GB RAM, 24 vCPU, and up to 48 replicas. Additional usage is $0.015 per vCPU hour. None of that helps if a forgotten replica runs all weekend, so the other half of cost control is a list of what is actually on.`,
  },
  countries: {
    name: 'regions',
    text: `Coco is available in most countries and hosts its servers in data centers across the United States, the United Kingdom, Canada, Europe, India, Australia, New Zealand, and South Africa. A country page is the local view of that same network: developers, agents, startups, and small-to-medium-sized businesses in that market get the same high-RAM replicas, the same $20 monthly credit, and the same $0.015 per vCPU hour meter.`,
  },
}
