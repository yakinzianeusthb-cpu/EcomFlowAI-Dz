import type { AdConcept } from '../../../lib/adPack';
import type { PlatformCopy } from '../../../lib/adPlatforms';
import { zipPack, type PackFile } from '../../../lib/adPlatformExport';
import { saveBlob } from '../../../lib/download';
import type { ProjectLanguage } from '../../../lib/projectRules';
import type { CreativeAssets } from '../../ads/CreativeCard';
import type { PackImage } from './usePackImages';

/** What every platform pack gets from the Publish tab. */
export interface PackProps {
  /** the copy being edited (saved by the Publish tab, not by the pack) */
  copy: PlatformCopy;
  onChange: (next: PlatformCopy) => void;
  /** the concepts the copy was written from, in its order */
  concepts: AdConcept[];
  /** campaign photos, logo and colours for the pictures; null while they load */
  assets: CreativeAssets | null;
  productName: string;
  campaignName: string;
  /** language of the ad copy (not of the interface) */
  language: ProjectLanguage;
}

/** Zips the texts and pictures of a pack and saves the zip. */
export async function downloadPack(zipName: string, texts: PackFile[], images: PackImage[]): Promise<void> {
  const pictures = await Promise.all(images.map(async (img) => ({ name: img.name, data: new Uint8Array(await img.blob.arrayBuffer()) })));
  const zip = zipPack([...texts, ...pictures]);
  saveBlob(new Blob([zip], { type: 'application/zip' }), zipName);
}
