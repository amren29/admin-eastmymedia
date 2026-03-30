import { supabase } from './supabase';

export interface SystemSettings {
    enablePackages: boolean;
    websiteName?: string;
    siteLogo?: string;
    favicon?: string;
    footerDescription?: string;
    copyrightText?: string;
    officeAddress?: string;
    officialEmail?: string;
    officePhone?: string;
    whatsappNumber?: string;
    googleMapsEmbed?: string;
    packagesMenuLabel?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    linkedinUrl?: string;
    whatsappMessage?: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'general')
            .single();

        if (error) throw error;

        return {
            enablePackages: data.enable_packages ?? true,
            websiteName: data.website_name,
            siteLogo: data.site_logo,
            favicon: data.favicon,
            footerDescription: data.footer_description,
            copyrightText: data.copyright_text,
            officeAddress: data.office_address,
            officialEmail: data.official_email,
            officePhone: data.office_phone,
            whatsappNumber: data.whatsapp_number,
            googleMapsEmbed: data.google_maps_embed,
            packagesMenuLabel: data.packages_menu_label,
            heroTitle: data.hero_title,
            heroSubtitle: data.hero_subtitle,
            facebookUrl: data.facebook_url,
            instagramUrl: data.instagram_url,
            tiktokUrl: data.tiktok_url,
            linkedinUrl: data.linkedin_url,
            whatsappMessage: data.whatsapp_message,
        };
    } catch (error) {
        console.error("Error fetching settings:", error);
        return { enablePackages: true };
    }
}

export async function updateSystemSettings(data: Partial<SystemSettings>): Promise<boolean> {
    try {
        const snakeCaseData: Record<string, any> = {};

        if (data.enablePackages !== undefined) snakeCaseData.enable_packages = data.enablePackages;
        if (data.websiteName !== undefined) snakeCaseData.website_name = data.websiteName;
        if (data.siteLogo !== undefined) snakeCaseData.site_logo = data.siteLogo;
        if (data.favicon !== undefined) snakeCaseData.favicon = data.favicon;
        if (data.footerDescription !== undefined) snakeCaseData.footer_description = data.footerDescription;
        if (data.copyrightText !== undefined) snakeCaseData.copyright_text = data.copyrightText;
        if (data.officeAddress !== undefined) snakeCaseData.office_address = data.officeAddress;
        if (data.officialEmail !== undefined) snakeCaseData.official_email = data.officialEmail;
        if (data.officePhone !== undefined) snakeCaseData.office_phone = data.officePhone;
        if (data.whatsappNumber !== undefined) snakeCaseData.whatsapp_number = data.whatsappNumber;
        if (data.googleMapsEmbed !== undefined) snakeCaseData.google_maps_embed = data.googleMapsEmbed;
        if (data.packagesMenuLabel !== undefined) snakeCaseData.packages_menu_label = data.packagesMenuLabel;
        if (data.heroTitle !== undefined) snakeCaseData.hero_title = data.heroTitle;
        if (data.heroSubtitle !== undefined) snakeCaseData.hero_subtitle = data.heroSubtitle;
        if (data.facebookUrl !== undefined) snakeCaseData.facebook_url = data.facebookUrl;
        if (data.instagramUrl !== undefined) snakeCaseData.instagram_url = data.instagramUrl;
        if (data.tiktokUrl !== undefined) snakeCaseData.tiktok_url = data.tiktokUrl;
        if (data.linkedinUrl !== undefined) snakeCaseData.linkedin_url = data.linkedinUrl;
        if (data.whatsappMessage !== undefined) snakeCaseData.whatsapp_message = data.whatsappMessage;

        const { error } = await supabase
            .from('settings')
            .update(snakeCaseData)
            .eq('key', 'general');

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Error updating settings:", error);
        return false;
    }
}
