import {
  Attachment,
  AttachmentCodec,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { Web3Storage, Filelike } from "web3.storage";

export default class Upload implements Filelike {
  name: string;
  data: Uint8Array;

  constructor(name: string, data: Uint8Array) {
    this.name = name;
    this.data = data;
  }

  stream(): ReadableStream {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from(self.data));
        controller.close();
      },
    });
  }
}

export async function upload(
  attachment: Attachment
): Promise<RemoteAttachment> {
  const encryptedEncoded = await RemoteAttachmentCodec.encodeEncrypted(
    attachment,
    new AttachmentCodec()
  );

  let token: string | null = localStorage.getItem("web3storageToken");

  if (!token) {
    token = prompt("Enter your web3.storage token");

    if (token) {
      localStorage.setItem("web3storageToken", token);
    }
  }

  if (!token) {
    alert("No token, sorry.");
    throw new Error("no web3.storage token found");
  }

  const web3Storage = new Web3Storage({
    token: token,
  });

  const upload = new Upload("XMTPEncryptedContent", encryptedEncoded.payload);
  const cid = await web3Storage.put([upload]);
  const url = `https://${cid}.ipfs.w3s.link/XMTPEncryptedContent`;

  return {
    url: url,
    contentDigest: encryptedEncoded.digest,
    salt: encryptedEncoded.salt,
    nonce: encryptedEncoded.nonce,
    secret: encryptedEncoded.secret,
    scheme: "https://",
    filename: attachment.filename,
    contentLength: attachment.data.byteLength,
  };
}
