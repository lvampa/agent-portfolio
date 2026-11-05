# Networking

```mermaid
flowchart LR
  visitor["Visitor browser<br/>portfolio on Cloudflare Pages"]
  operator["Operator<br/>home IP"]

  subgraph cf["Cloudflare edge"]
    direction TB
    apiHost["api host<br/>/webhook/*, /webhook-test/*<br/>rate limit, 4 KB body cap"]
    adminHost["admin host<br/>Access: home IP only"]
    tunnel["Cloudflare Tunnel"]
  end

  subgraph aws["AWS us-east-2"]
    subgraph vpc["VPC, public subnet"]
      subgraph ec2["EC2 t4g.small, ECS on EC2<br/>SG ingress: 22/tcp from home IP only"]
        subgraph task["ECS task, bridge network"]
          direction LR
          cloudflared["cloudflared"] -->|"HTTP :80"| caddy["Caddy<br/>routes by host"] -->|"HTTP :5678"| n8n["n8n<br/>SQLite"]
        end
      end
      ebs[("EBS gp3, encrypted<br/>/opt/n8n-data")]
    end
    ssm["SSM Parameter Store<br/>n8n key, tunnel token"]
    dlm["DLM<br/>daily snapshots, 7 kept"]
  end

  visitor -->|HTTPS| apiHost
  operator -->|HTTPS| adminHost
  apiHost --> tunnel
  adminHost --> tunnel
  cloudflared -. "outbound only<br/>:7844 QUIC/HTTP2" .-> tunnel
  n8n --- ebs
  dlm -.-> ebs
  ssm -. "secrets at task start" .-> task
  operator -->|"SSH :22<br/>Elastic IP"| ec2

  classDef external fill:#f4f4f5,stroke:#71717a,color:#18181b
  classDef cloudflare fill:#fff4e6,stroke:#f38020,color:#18181b
  classDef compute fill:#eef4ff,stroke:#3b6fd8,color:#18181b
  classDef data fill:#ecfdf3,stroke:#2f9e5b,color:#18181b
  classDef control fill:#f5f0ff,stroke:#7c5cc4,color:#18181b

  class visitor,operator external
  class apiHost,adminHost,tunnel cloudflare
  class cloudflared,caddy,n8n compute
  class ebs data
  class ssm,dlm control

  style cf fill:#fffaf5,stroke:#f38020
  style aws fill:#fafafa,stroke:#ff9900
  style vpc fill:#ffffff,stroke:#8c8c8c,stroke-dasharray:4 4
  style ec2 fill:#f8faff,stroke:#3b6fd8
  style task fill:#ffffff,stroke:#3b6fd8,stroke-dasharray:4 4
```

- No web port is open on the instance.
  `cloudflared` dials out to Cloudflare, and requests come back over that connection.
- SSH from the home IP is the only inbound rule.
- The rate limit covers `/webhook` paths on the whole zone, because the free plan cannot scope it to one host.
  The 4 KB body cap is set in Caddy on the api host.
- The admin host is reachable only from the home IP through Access.
- The task reads its secrets from SSM when it starts, so none are in the task definition.
