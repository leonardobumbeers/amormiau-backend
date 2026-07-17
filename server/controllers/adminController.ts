const User = require('../models/userModel');
import type { NextFunction, Request, Response } from 'express';

interface MutableCat {
  name?: unknown; birthDate?: unknown; weight?: unknown; sterilized?: unknown;
  specialCat?: unknown; description?: unknown; available?: unknown;
  sociable?: unknown; playful?: unknown; affectionate?: unknown;
  images?: unknown;
  save(): Promise<unknown>;
}
interface MutableUser { cats: unknown[]; save(): Promise<unknown> }
const Cat = require('../models/catModel');
const { roles } = require('../roles');
const { sanitizeUser } = require('../util/privacy');

function remoteImages(body: Record<string, unknown>): Array<{ url: string; sourceUrl?: string }> {
  if (Array.isArray(body.imageUrls)) {
    const sourceUrls = Array.isArray(body.imageSourceUrls) ? body.imageSourceUrls : [];
    return body.imageUrls
      .filter((url): url is string => typeof url === 'string' && Boolean(url.trim()))
      .map((url, index) => ({
        url: url.trim(),
        ...(typeof sourceUrls[index] === 'string' ? { sourceUrl: sourceUrls[index] } : {})
      }));
  }

  return typeof body.imageUrl === 'string' && body.imageUrl.trim()
    ? [{ url: body.imageUrl.trim(), ...(typeof body.imageSourceUrl === 'string' ? { sourceUrl: body.imageSourceUrl } : {}) }]
    : [];
}

exports.grantAccess = function (action: string, resource: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permission = roles.can(req.user.role)[action](resource);
      if (!permission.granted) throw new Error("You don't have enough permission to perform this action");
      next()
    } catch (error) {
      next(error)
    }
  }
}

exports.allowIfLoggedin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = res.locals.loggedInUser;
    if (!user) throw new Error("You need to be logged in to access this route");
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

exports.registerCat = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const {
      name,
      birthDate,
      weight,
      sterilized,
      specialCat,
      description,
      available,
      sociable,
      playful,
      affectionate
    } = req.body
    const images = Array.isArray(req.files) ? req.files : [];

    // console.log(JSON.stringify(images, null, 2));
    // if(images.length === 0) throw new Error('No images were uploaded')


    const newCat = new Cat({
      name: name,
      birthDate: birthDate,
      weight: weight,
      sterilized: sterilized,
      specialCat: specialCat,
      available: available || true,
      description: description,
      sociable: sociable || 0,
      playful: playful || 0,
      affectionate: affectionate || 0,
      images: remoteImages(req.body)

    });

    for (const image of images) {
      const uploadedImage = image as Express.Multer.File & { key: string };
      newCat.images.push({
        fileName: image.originalname,
        key: uploadedImage.key,
        size: image.size,
        dest: image.destination
      })
    }

    await newCat.save();
    res.json({
      data: newCat,
      message: "Cat is registered successfully"
    })
  } catch (e) {
    next(e)
  }
}

exports.getCats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await Cat.find();
    res.status(200).json({ data: cats })
  } catch (e) {
    next(e)
  };
}

exports.getAvailableCats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await Cat.find({ available: true });
    res.status(200).json({ data: cats });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableCat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await Cat.findOne({ _id: req.params.catId, available: true });
    if (!cat) throw new Error('Cat not found');
    res.status(200).json({ data: cat });
  } catch (error) {
    next(error);
  }
};


exports.getCat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const catId = req.params.catId;
    const cat = await Cat.findById(catId)
    if (!cat) throw new Error("Cat not found");
    res.status(200).json({
      data: cat
    });
  } catch (e) {
    next(e)
  }
}


exports.updateCat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedName = req.body.name;
    const updatedBirthDate = req.body.birthDate;
    const updatedWeight = req.body.weight;
    const updatedSterilized = req.body.sterilized;
    const updatedSpecialCat = req.body.specialCat;
    const updatedDescription = req.body.description;
    const updatedAvailable = req.body.available;
    const updatedSociable = req.body.sociable;
    const updatedPlayful = req.body.playful;
    const updatedAffectionate = req.body.affectionate;
    const updatedImages = remoteImages(req.body);

    const catId = req.params.catId;
    const cat = await Cat.findById(catId)
    if (!cat) throw new Error("Cat not found");

    const catNew = await Cat.findById(catId)
      .then((cat: MutableCat) => {
        cat.name = updatedName;
        cat.birthDate = updatedBirthDate;
        cat.weight = updatedWeight;
        cat.sterilized = updatedSterilized;
        cat.specialCat = updatedSpecialCat;
        cat.description = updatedDescription;
        cat.available = updatedAvailable;
        cat.sociable = updatedSociable;
        cat.playful = updatedPlayful;
        cat.affectionate = updatedAffectionate;
        if (updatedImages.length) {
          cat.images = updatedImages;
        }
        return cat.save()
      })

    res.status(200).json({
      data: catNew,
      message: "Cat is updated successfully"
    });


  } catch (e) {
    next(e)
  }
}

exports.adoptCat = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const catId = req.params.catId;
    const userId = req.body.userId


    await User.findOneAndUpdate({ cats: { $in: [catId] } }, { $set: { cats: [] } })
    const user = await User.findById(userId)
    if (!user) throw new Error('User not found')

    const cat = await Cat.findById(catId)
    if (!cat) throw new Error("Cat not found");

    const catNew = await Cat.findById(catId)
      .then((cat: MutableCat) => {
        cat.available = false;
        return cat.save()
      })
    const userNew = await User.findById(userId)
      .then((user: MutableUser) => {
        user.cats = [catId];
        return user.save()
      })

    res.status(200).json({
      data: catNew, userNew: sanitizeUser(userNew),
      message: "Cat and User updated successfully"
    });

  } catch (e) {
    next(e)
  }
}

exports.deprecatedAdoptCat = (_req: Request, res: Response) => res.status(410).json({
  error: 'Direct adoption is disabled; submit and review an adoption request'
});

exports.deleteCat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const catId = req.params.catId;
    const cat = await Cat.findById(catId);
    if (!cat) throw new Error("Cat not found");
    await cat.remove();
    res.status(200).json({
      // data: null,
      message: "Cat is deleted successfully"
    });
  } catch (e) {
    next(e)
  }
}
