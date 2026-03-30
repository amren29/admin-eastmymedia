"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getSystemSettings,
  updateSystemSettings,
  SystemSettings,
} from "@/lib/settings";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [websiteName, setWebsiteName] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [favicon, setFavicon] = useState("");
  const [footerDescription, setFooterDescription] = useState("");
  const [copyrightText, setCopyrightText] = useState("");

  const [officeAddress, setOfficeAddress] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [googleMapsEmbed, setGoogleMapsEmbed] = useState("");

  const [packagesMenuLabel, setPackagesMenuLabel] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");

  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [whatsappMessage, setWhatsappMessage] = useState("");

  const [enablePackages, setEnablePackages] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSystemSettings();
      setWebsiteName(settings.websiteName || "");
      setSiteLogo(settings.siteLogo || "");
      setFavicon(settings.favicon || "");
      setFooterDescription(settings.footerDescription || "");
      setCopyrightText(settings.copyrightText || "");
      setOfficeAddress(settings.officeAddress || "");
      setOfficialEmail(settings.officialEmail || "");
      setOfficePhone(settings.officePhone || "");
      setWhatsappNumber(settings.whatsappNumber || "");
      setGoogleMapsEmbed(settings.googleMapsEmbed || "");
      setPackagesMenuLabel(settings.packagesMenuLabel || "");
      setHeroTitle(settings.heroTitle || "");
      setHeroSubtitle(settings.heroSubtitle || "");
      setFacebookUrl(settings.facebookUrl || "");
      setInstagramUrl(settings.instagramUrl || "");
      setTiktokUrl(settings.tiktokUrl || "");
      setLinkedinUrl(settings.linkedinUrl || "");
      setWhatsappMessage(settings.whatsappMessage || "");
      setEnablePackages(settings.enablePackages);
      setLoading(false);
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data: Partial<SystemSettings> = {
      websiteName,
      siteLogo,
      favicon,
      footerDescription,
      copyrightText,
      officeAddress,
      officialEmail,
      officePhone,
      whatsappNumber,
      googleMapsEmbed,
      packagesMenuLabel,
      heroTitle,
      heroSubtitle,
      facebookUrl,
      instagramUrl,
      tiktokUrl,
      linkedinUrl,
      whatsappMessage,
      enablePackages,
    };

    await updateSystemSettings(data);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Branding */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Branding</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="websiteName">Website Name</Label>
              <Input
                id="websiteName"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteLogo">Site Logo URL</Label>
              <Input
                id="siteLogo"
                value={siteLogo}
                onChange={(e) => setSiteLogo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="favicon">Favicon URL</Label>
              <Input
                id="favicon"
                value={favicon}
                onChange={(e) => setFavicon(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerDescription">Footer Description</Label>
              <Textarea
                id="footerDescription"
                value={footerDescription}
                onChange={(e) => setFooterDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="copyrightText">Copyright Text</Label>
              <Input
                id="copyrightText"
                value={copyrightText}
                onChange={(e) => setCopyrightText(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Contact</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="officeAddress">Office Address</Label>
              <Textarea
                id="officeAddress"
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="officialEmail">Official Email</Label>
                <Input
                  id="officialEmail"
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officePhone">Office Phone</Label>
                <Input
                  id="officePhone"
                  value={officePhone}
                  onChange={(e) => setOfficePhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="googleMapsEmbed">Google Maps Embed</Label>
              <Textarea
                id="googleMapsEmbed"
                value={googleMapsEmbed}
                onChange={(e) => setGoogleMapsEmbed(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Frontend */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Frontend</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="packagesMenuLabel">Packages Menu Label</Label>
              <Input
                id="packagesMenuLabel"
                value={packagesMenuLabel}
                onChange={(e) => setPackagesMenuLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Input
                id="heroTitle"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Input
                id="heroSubtitle"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Social */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Social</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input
                  id="facebookUrl"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input
                  id="instagramUrl"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tiktokUrl">TikTok URL</Label>
                <Input
                  id="tiktokUrl"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">WhatsApp</h2>
          <div className="space-y-2">
            <Label htmlFor="whatsappMessage">WhatsApp Message</Label>
            <Textarea
              id="whatsappMessage"
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={4}
            />
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Features</h2>
          <div className="flex items-center gap-3">
            <input
              id="enablePackages"
              type="checkbox"
              checked={enablePackages}
              onChange={(e) => setEnablePackages(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="enablePackages">Enable Packages</Label>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
