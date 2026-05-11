// Upload file and metadata to IPFS via Pinata
// Set your Pinata JWT in .env.local: NEXT_PUBLIC_PINATA_JWT=<your_jwt>

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

export async function uploadFileToIPFS(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));
  formData.append("pinataMetadata", JSON.stringify({ name: file.name }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload image to IPFS");
  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
}

export async function uploadMetadataToIPFS(metadata) {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: metadata.name },
      pinataOptions: { cidVersion: 1 },
    }),
  });

  if (!res.ok) throw new Error("Failed to upload metadata to IPFS");
  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
}
